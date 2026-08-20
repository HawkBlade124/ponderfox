import emptyStateImage from "../assets/empty-state.png";

function EmptyStateArt({ size = 96, className = "" }) {
  return (
    <img
      src={emptyStateImage}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
    />
  );
}

export default EmptyStateArt;