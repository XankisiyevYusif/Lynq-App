 
import { createContext, useState } from "react";

export const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
    
  const [refreshData, setRefreshData] = useState(false);

  return (
    <RefreshContext.Provider value={{ refreshData, setRefreshData }}>
      {children}
    </RefreshContext.Provider>
  );
};
