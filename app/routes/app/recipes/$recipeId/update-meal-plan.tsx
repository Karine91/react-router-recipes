import ReactModal from "react-modal";
import React from "react";

if (typeof window !== "undefined") {
  ReactModal.setAppElement("#root");
}

const UpdateMealPlan = () => {
  const [isOpen, setIsOpen] = React.useState(true);
  React.useEffect(() => {
    setIsOpen(true);
  }, []);
  return <ReactModal isOpen={isOpen}>UpdateMealPlan</ReactModal>;
};
export default UpdateMealPlan;
