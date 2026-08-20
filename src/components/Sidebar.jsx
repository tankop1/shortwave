import Icon from "./Icon";
import { NAV } from "../data";

export default function Sidebar({ active = "home" }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-name">Shortwave</div>
        <div className="brand-tag">The UT film site</div>
      </div>

      <nav className="side-nav">
        {NAV.map((group) => (
          <div key={group.section} className="nav-group">
            <div className="nav-label">{group.section}</div>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`side-link${item.id === active ? " is-active" : ""}`}
              >
                <Icon name={item.icon} />
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="side-foot">
        <button type="button" className="upload-solid">
          <Icon name="plus" className="icon-dark" />
          Upload a film
        </button>
      </div>
    </aside>
  );
}
