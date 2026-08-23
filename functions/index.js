import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import * as functions from "firebase-functions/v1";
import { creditInviteEmail, creditInviteText } from "./email.js";

initializeApp();
const db = getFirestore();
const adminAuth = getAuth();

const APP_URL = process.env.APP_URL || "https://shortwave-ut.web.app";
const MAIL_FROM = process.env.MAIL_FROM || "Shortwave <beth.t@example.com>";

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isLiveFilm(film) {
  return (
    film?.status === "published" &&
    (film.visibility === "public" ||
      film.visibility === "unlisted" ||
      !film.visibility)
  );
}

function emailsForUser(auth, profile) {
  return [auth?.token?.email, profile?.email, profile?.utEmail]
    .filter(Boolean)
    .map(normalizeEmail);
}

function inviteDoc(id) {
  return db.collection("invites").doc(id);
}

function acceptLink(invite, token) {
  const base = String(invite?.appUrl || APP_URL).replace(/\/$/, "");
  return `${base}/invite/${token}`;
}

function filmTitleOf(film) {
  return film?.title || film?.title || "Untitled";
}

function ownerNameOf(film) {
  return film?.ownerName || film?.ownerName || "A filmmaker";
}

function crewToken(member) {
  return String(member?.inviteToken || member?.inviteToken || "").trim();
}

function crewUserId(member) {
  return String(member?.userId || member?.userId || "").trim();
}

function crewSentAt(member) {
  return member?.inviteSentAt || member?.inviteSentAt || null;
}

async function deliverCreditInvite({ filmId, film, member, token, force = false }) {
  const inviteRef = inviteDoc(token);
  const inviteSnap = await inviteRef.get();
  const invite = inviteSnap.exists ? inviteSnap.data() : {};
  if (!force && invite.inviteSentAt) {
    return { sent: false, inviteSentAt: invite.inviteSentAt };
  }

  const title = filmTitleOf(film);
  const ownerName = ownerNameOf(film);
  const roles = Array.isArray(member.roles) ? member.roles : [];
  const kind = member.kind || member.kind || "crew";
  const acceptUrl = acceptLink(invite, token);

  await sendResendEmail({
    to: member.email.trim(),
    subject: `${ownerName} credited you on ${title}`,
    html: creditInviteEmail({
      ownerName,
      filmTitle: title,
      role: member.role,
      roles,
      kind,
      poster: film.poster || invite.filmPoster,
      logline: film.logline || invite.logline,
      acceptUrl,
      inviteeName: member.name,
    }),
    text: creditInviteText({
      ownerName,
      filmTitle: title,
      role: member.role,
      roles,
      kind,
      acceptUrl,
      inviteeName: member.name,
      logline: film.logline || invite.logline,
    }),
    idempotencyKey: force ? `resend-${token}-${Date.now()}` : token,
  });

  const sentAt = FieldValue.serverTimestamp();
  await inviteRef.set(
    {
      filmId,
      filmTitle: title,
      filmPoster: film.poster || "",
      logline: film.logline || "",
      visibility: film.visibility,
      ownerId: film.ownerId || film.ownerId || "",
      ownerName,
      name: member.name,
      email: member.email.trim(),
      emailLower: normalizeEmail(member.email),
      role: member.role,
      roles,
      kind,
      state: "sent",
      inviteSentAt: sentAt,
      updatedAt: sentAt,
    },
    { merge: true },
  );
  return { sent: true };
}

async function sendResendEmail({ to, subject, html, text, idempotencyKey }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to functions/.env and redeploy.",
    );
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [to],
      subject,
      html,
      text,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.message || `Resend failed (${response.status})`;
    if (String(detail).toLowerCase().includes("domain is not verified")) {
      throw new Error(
        `${detail} Until that domain is verified, Shortwave can’t email invited cast and crew.`,
      );
    }
    throw new Error(detail);
  }
  return payload;
}

async function sendPendingInvites(filmId) {
  const filmSnap = await db.collection("films").doc(filmId).get();
  if (!filmSnap.exists) {
    throw new Error("That project is gone.");
  }
  const after = filmSnap.data();
  if (!isLiveFilm(after)) return { sent: 0 };

  const crew = Array.isArray(after.crew)
    ? after.crew.map((member) => ({ ...member }))
    : [];
  const pendingIndexes = crew
    .map((member, index) =>
      member?.state === "invited" &&
      member.email &&
      !crewSentAt(member) &&
      !crewUserId(member)
        ? index
        : -1,
    )
    .filter((index) => index >= 0);
  if (!pendingIndexes.length) return { sent: 0 };

  const failures = [];
  let sent = 0;
  for (const index of pendingIndexes) {
    const member = crew[index];
    const token = crewToken(member) || crypto.randomUUID();
    try {
      const result = await deliverCreditInvite({
        filmId,
        film: after,
        member,
        token,
        force: false,
      });
      crew[index] = {
        ...member,
        inviteToken: token,
        inviteSentAt: result.sent
          ? new Date().toISOString()
          : result.inviteSentAt || crewSentAt(member),
      };
      if (result.sent) sent += 1;
    } catch (err) {
      failures.push(`${member.name} (${member.email}): ${err.message}`);
    }
  }

  if (sent > 0) await filmSnap.ref.update({ crew });
  if (failures.length) {
    throw new Error(
      failures.length === 1
        ? `Couldn’t email ${failures[0]}`
        : `Couldn’t email ${failures.length} people. ${failures.join(" ")}`,
    );
  }
  return { sent };
}

export const sendCreditInviteEmails = functions.firestore
  .document("films/{filmId}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) return;
    const after = change.after.data();
    if (!after || !isLiveFilm(after)) return;
    try {
      await sendPendingInvites(context.params.filmId);
    } catch (err) {
      console.error("sendCreditInviteEmails", err);
    }
  });

export const sendFilmCreditInvites = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Sign in to send invites.",
      );
    }
    const filmId = String(data?.filmId || "").trim();
    if (!filmId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing project.",
      );
    }
    const filmSnap = await db.collection("films").doc(filmId).get();
    if (!filmSnap.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "That project is gone.",
      );
    }
    if (filmSnap.data().ownerId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only the filmmaker can send these invites.",
      );
    }
    try {
      return await sendPendingInvites(filmId);
    } catch (err) {
      throw new functions.https.HttpsError(
        "internal",
        err.message || "Couldn’t send invite emails.",
      );
    }
  },
);

export const sendTestInviteEmail = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Sign in to send a test invite.",
      );
    }
    const token = "preview";
    const acceptUrl = acceptLink({ appUrl: APP_URL }, token);
    try {
      await sendResendEmail({
        to: "shortwaveut@gmail.com",
        subject: "Jordan Hale credited you on Night Bus",
        html: creditInviteEmail({
          ownerName: "Jordan Hale",
          filmTitle: "Night Bus",
          role: "Cinematographer",
          roles: ["Cinematographer"],
          kind: "crew",
          poster: "https://i.ytimg.com/vi/aqz-KE-bpKQ/maxresdefault.jpg",
          logline: "A late ride home turns into a night the city won’t forget.",
          acceptUrl,
          inviteeName: "Maya",
        }),
        text: creditInviteText({
          ownerName: "Jordan Hale",
          filmTitle: "Night Bus",
          role: "Cinematographer",
          roles: ["Cinematographer"],
          kind: "crew",
          acceptUrl,
          inviteeName: "Maya",
          logline: "A late ride home turns into a night the city won’t forget.",
        }),
        idempotencyKey: `test-invite-${Date.now()}`,
      });
      return { ok: true };
    } catch (err) {
      throw new functions.https.HttpsError(
        "internal",
        err.message || "Couldn’t send the test invite.",
      );
    }
  },
);

export const listPendingInvites = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Sign in to view pending invites.",
    );
  }
  const filmsSnap = await db.collection("films").get();
  const invites = [];
  for (const filmDoc of filmsSnap.docs) {
    const film = filmDoc.data();
    const crew = Array.isArray(film.crew) ? film.crew : [];
    for (const member of crew) {
      if (member?.state !== "invited" || !member.email || crewUserId(member)) continue;
      const roles = Array.isArray(member.roles) ? member.roles : member.role ? [member.role] : [];
      invites.push({
        token: crewToken(member),
        filmId: filmDoc.id,
        filmTitle: filmTitleOf(film),
        name: member.name || "",
        email: member.email.trim(),
        role: member.role || "",
        roles,
        kind: member.kind || member.kind || "crew",
      });
    }
  }
  invites.sort(
    (a, b) =>
      (a.filmTitle || "").localeCompare(b.filmTitle || "") ||
      (a.name || "").localeCompare(b.name || "") ||
      (a.email || "").localeCompare(b.email || ""),
  );
  return { invites };
});

export const sendCreditInviteEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Sign in to send an invite.",
    );
  }
  const filmId = String(data?.filmId || "").trim();
  const email = normalizeEmail(data?.email);
  let token = String(data?.token || "").trim();
  if (!filmId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing project.");
  }

  const filmSnap = await db.collection("films").doc(filmId).get();
  if (!filmSnap.exists) {
    throw new functions.https.HttpsError("not-found", "That project is gone.");
  }
  const film = filmSnap.data();
  const crew = Array.isArray(film.crew) ? film.crew.map((member) => ({ ...member })) : [];
  const index = crew.findIndex((member) => {
    if (token && crewToken(member) === token) return true;
    if (email && normalizeEmail(member.email) === email && member.state === "invited") return true;
    return false;
  });
  if (index < 0) {
    throw new functions.https.HttpsError("not-found", "That invite is gone.");
  }
  const member = crew[index];
  if (!member.email) {
    throw new functions.https.HttpsError("failed-precondition", "That credit has no email.");
  }
  token = crewToken(member) || token || crypto.randomUUID();

  try {
    await deliverCreditInvite({ filmId, film, member, token, force: true });
    crew[index] = {
      ...member,
      inviteToken: token,
      inviteToken: token,
      inviteSentAt: new Date().toISOString(),
      inviteSentAt: new Date().toISOString(),
    };
    await filmSnap.ref.update({ crew });
    return { ok: true, token };
  } catch (err) {
    throw new functions.https.HttpsError(
      "internal",
      err.message || "Couldn’t send the invite.",
    );
  }
});

export const claimInvitesOnProfile = functions.firestore
  .document("users/{uid}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) return;
    const after = change.after.data();
    const uid = context.params.uid;
    if (!after?.onboarded) return;

    const emails = [
      ...new Set(
        [after.email, after.utEmail].filter(Boolean).map(normalizeEmail),
      ),
    ];
    if (!emails.length) return;

    const snaps = await Promise.all(
      emails.map((email) =>
        db.collection("invites").where("emailLower", "==", email).get(),
      ),
    );
    const invites = new Map();
    for (const snap of snaps) {
      for (const docSnap of snap.docs)
        invites.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
    }

    for (const invite of invites.values()) {
      if (invite.state === "accepted" || !invite.filmId) continue;
      const filmRef = db.collection("films").doc(invite.filmId);
      await db.runTransaction(async (tx) => {
        const filmSnap = await tx.get(filmRef);
        if (!filmSnap.exists) return;
        const film = filmSnap.data();
        let changed = false;
        const nextCrew = (Array.isArray(film.crew) ? film.crew : []).map(
          (member) => {
            const matchesToken = member.inviteToken === invite.id;
            const matchesEmail =
              normalizeEmail(member.email) === normalizeEmail(invite.email);
            if (!matchesToken && !matchesEmail) return member;
            if (member.userId && member.userId !== uid) return member;
            if (member.userId === uid && member.state !== "invited")
              return member;
            changed = true;
            return {
              ...member,
              userId: uid,
              state: member.state === "accepted" ? "accepted" : "pending",
            };
          },
        );
        if (!changed) return;
        tx.update(filmRef, {
          crew: nextCrew,
          crewUids: [...new Set([...(film.crewUids || []), uid])],
        });
        tx.set(
          inviteDoc(invite.id),
          { claimedBy: uid, updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      });
    }
  });

export const acceptCreditInvite = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Sign in to accept this credit.",
      );
    }
    const token = String(data?.token || "").trim();
    if (!token) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing invite.",
      );
    }

    const uid = context.auth.uid;
    const [inviteSnap, profileSnap] = await Promise.all([
      inviteDoc(token).get(),
      db.collection("users").doc(uid).get(),
    ]);
    if (!inviteSnap.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "This invite isn’t valid.",
      );
    }
    const invite = inviteSnap.data();
    const profile = profileSnap.exists ? profileSnap.data() : null;
    if (!profile?.onboarded) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Finish setting up your Shortwave profile first.",
      );
    }
    if (
      !emailsForUser(context.auth, profile).includes(
        normalizeEmail(invite.email),
      )
    ) {
      throw new functions.https.HttpsError(
        "permission-denied",
        `This invite was sent to ${invite.email}.`,
      );
    }

    const filmRef = db.collection("films").doc(invite.filmId);
    await db.runTransaction(async (tx) => {
      const filmSnap = await tx.get(filmRef);
      if (!filmSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "That project is gone.",
        );
      }
      const film = filmSnap.data();
      const nextCrew = (Array.isArray(film.crew) ? film.crew : []).map(
        (member) => {
          const matchesToken = member.inviteToken === token;
          const matchesEmail =
            normalizeEmail(member.email) === normalizeEmail(invite.email) &&
            member.state === "invited";
          if (!matchesToken && !matchesEmail) return member;
          return { ...member, userId: uid, state: "accepted" };
        },
      );
      tx.update(filmRef, {
        crew: nextCrew,
        crewUids: [...new Set([...(film.crewUids || []), uid])],
      });
      tx.set(
        inviteSnap.ref,
        {
          state: "accepted",
          acceptedBy: uid,
          acceptedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    return { ok: true };
  },
);

async function commitDeletes(refs) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = db.batch();
    refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

async function deleteQuery(queryRef) {
  while (true) {
    const snap = await queryRef.limit(400).get();
    if (snap.empty) return;
    await commitDeletes(snap.docs.map((item) => item.ref));
    if (snap.size < 400) return;
  }
}

async function deleteOwnedFilm(filmRef) {
  await Promise.all([
    deleteQuery(filmRef.collection("reviews")),
    deleteQuery(filmRef.collection("viewers")),
  ]);
  await filmRef.delete();
}

export const deleteOwnAccount = functions
  .runWith({ timeoutSeconds: 120, memory: "512MB" })
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Sign in to delete your account.",
      );
    }
    const uid = context.auth.uid;
    const userRef = db.collection("users").doc(uid);
    const profileSnap = await userRef.get();
    const profile = profileSnap.exists ? profileSnap.data() : {};

    const ownedFilms = await db
      .collection("films")
      .where("ownerId", "==", uid)
      .get();
    for (const filmSnap of ownedFilms.docs) {
      await deleteOwnedFilm(filmSnap.ref);
    }

    const crewedFilms = await db
      .collection("films")
      .where("crewUids", "array-contains", uid)
      .get();
    for (const filmSnap of crewedFilms.docs) {
      const film = filmSnap.data();
      const nextCrew = (Array.isArray(film.crew) ? film.crew : []).filter(
        (member) => member?.userId !== uid,
      );
      await filmSnap.ref.update({
        crew: nextCrew,
        crewUids: (film.crewUids || []).filter((id) => id !== uid),
      });
    }

    await deleteQuery(db.collection("invites").where("ownerId", "==", uid));
    await deleteQuery(userRef.collection("messages"));

    const slug = String(profile?.portfolioSlug || "").trim();
    if (slug) {
      const slugRef = db.collection("portfolioSlugs").doc(slug);
      const slugSnap = await slugRef.get();
      if (slugSnap.exists && slugSnap.data()?.uid === uid) {
        await slugRef.delete();
      }
    }

    try {
      const reviewSnaps = await db
        .collectionGroup("reviews")
        .where("userId", "==", uid)
        .get();
      await commitDeletes(reviewSnaps.docs.map((item) => item.ref));
    } catch {
      /* collection-group index may be missing */
    }

    if (profileSnap.exists) await userRef.delete();
    await adminAuth.deleteUser(uid);
    return { ok: true };
  });
