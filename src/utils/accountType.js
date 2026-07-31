export const isEmployerAccount = (user) =>
  user?.userType === "Employer" ||
  user?.UserType === "Employer" ||
  user?.role === "Employer" ||
  user?.Role === "Employer" ||
  user?.basicInfo?.userType === "Employer" ||
  user?.basicInfo?.UserType === "Employer" ||
  user?.basicInfo?.role === "Employer" ||
  user?.basicInfo?.Role === "Employer" ||
  Boolean(user?.companyInfo) ||
  Boolean(user?.company);

export const getAccountHomePath = (user) =>
  isEmployerAccount(user) ? "/company/dashboard" : "/home";
