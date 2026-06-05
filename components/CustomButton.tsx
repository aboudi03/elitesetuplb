// *********************
// Role of the component: Custom button component
// Name of the component: CustomButton.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <CustomButton paddingX={paddingX} paddingY={paddingY} text={text} buttonType={buttonType} customWidth={customWidth} textSize={textSize} />
// Input parameters: CustomButtonProps interface
// Output: custom button component
// *********************

import React from "react";

interface CustomButtonProps {
  paddingX: number;
  paddingY: number;
  text: string;
  buttonType: "submit" | "reset" | "button";
  customWidth: string;
  textSize: string;
}

const CustomButton = ({
  text,
  buttonType,
  customWidth,
}: CustomButtonProps) => {


  return (
    <button
      type={`${buttonType}`}
      className={`${customWidth !== "no" ? `w-${customWidth}` : ""} theme-button rounded-md px-4 py-2 text-sm font-bold uppercase shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--site-accent)]`}
    >
      {text}
    </button>
  );
};

export default CustomButton;
