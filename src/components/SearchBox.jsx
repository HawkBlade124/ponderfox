function SearchBox({ value, onChange, placeholder, className = "" }) {
  return (
    <div className={`dashSearchInput ${className}`.trim()}>
      <i className="fa-regular fa-magnifying-glass"></i>
      <input type="text" value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

export default SearchBox;
