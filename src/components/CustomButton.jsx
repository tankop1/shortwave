export default function CustomButton({
  children,
  className = "",
  secondary = false,
  ...props
}) {
  const classes = ["btn", secondary ? "btn--secondary" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
