import React from "react";

const StyleButton = ({ iconWidth, iconHeight, iconSrc, iconAlt, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="text-blue-700 border border-blue-700 hover:bg-blue-700 hover:text-white focus:outline-none font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500"
    >
      <img width={iconWidth} height={iconHeight} src={iconSrc} alt={iconAlt} />
    </button>
  );
};

export default StyleButton;
