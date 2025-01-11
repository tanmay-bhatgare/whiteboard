import React from "react";

const StyleButton = ({ iconWidth, iconHeight, iconSrc, iconAlt, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="hover:bg-[#181822] hover:text-white focus:outline-none 
      font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center dark:hover:bg-[#181822]"
    >
      <img width={iconWidth} height={iconHeight} src={iconSrc} alt={iconAlt} />
    </button>
  );
};

export default StyleButton;
