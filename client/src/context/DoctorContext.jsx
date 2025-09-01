import React, { createContext, useState } from "react";

export const DoctorContext = createContext({ doctor: null });

export const DoctorProvider = ({ children }) => {
  const [doctor, setDoctor] = useState({
    _id: "123456",
    name: "Dr. John Doe",
    specialization: "Cardiology",
  });

  return (
    <DoctorContext.Provider value={{ doctor, setDoctor }}>
      {children}
    </DoctorContext.Provider>
  );
};
