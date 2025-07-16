import logoPath from "@assets/logo.png";

export const LOGO_URL = logoPath;

export const COMPANY_STATS = {
  totalVerifiedProfiles: 7000,
  dailyAddedProfiles: "50-70",
  highProfiles: 5000,
};

export const ADMIN_CREDENTIALS = {
  username: "admin12345",
  password: "admin12345",
};

export const GENDERS = {
  MALE: "Male",
  FEMALE: "Female",
} as const;

export const PROFESSION_OPTIONS = [
  "Doctor",
  "Engineer",
  "Teacher",
  "Business Owner",
  "Government Employee",
  "Private Employee",
  "Lawyer",
  "Accountant",
  "Student",
  "Other",
];

export const QUALIFICATION_OPTIONS = [
  "High School",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Diploma",
  "Certificate",
  "MBA",
  "Engineering Degree",
  "Medical Degree",
  "Law Degree",
  "Other",
];

export const HEIGHT_OPTIONS = [
  "4'10\"",
  "4'11\"",
  "5'0\"",
  "5'1\"",
  "5'2\"",
  "5'3\"",
  "5'4\"",
  "5'5\"",
  "5'6\"",
  "5'7\"",
  "5'8\"",
  "5'9\"",
  "5'10\"",
  "5'11\"",
  "6'0\"",
  "6'1\"",
  "6'2\"",
  "6'3\"",
  "6'4\"",
  "6'5\"",
];

// Simple age options for common ranges
export const AGE_OPTIONS = [
  "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
  "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45",
  "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60"
];

// Simple birth year options for common ranges
export const BIRTH_YEAR_OPTIONS = [
  "1960", "1961", "1962", "1963", "1964", "1965", "1966", "1967", "1968", "1969",
  "1970", "1971", "1972", "1973", "1974", "1975", "1976", "1977", "1978", "1979",
  "1980", "1981", "1982", "1983", "1984", "1985", "1986", "1987", "1988", "1989",
  "1990", "1991", "1992", "1993", "1994", "1995", "1996", "1997", "1998", "1999",
  "2000", "2001", "2002", "2003", "2004", "2005", "2006"
];

export const MARITAL_STATUS_OPTIONS = [
  "Single",
  "Divorced",
  "Widowed",
  "Separated",
  "Other"
];

export const RELIGION_OPTIONS = [
  "Islam",
  "Hindu",
  "Christian",
  "Buddhist",
  "Other"
];

// Dynamic options fetching function
export const fetchCustomOptions = async (fieldType: string) => {
  try {
    const response = await fetch(`/api/custom-options/${fieldType}`);
    if (response.ok) {
      const customOptions = await response.json();
      return customOptions.map((option: any) => option.value);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching custom options for ${fieldType}:`, error);
    return [];
  }
};

// Function to get combined options (default + custom)
export const getCombinedOptions = async (fieldType: string) => {
  const customOptions = await fetchCustomOptions(fieldType);
  
  switch (fieldType) {
    case 'profession':
      return [...PROFESSION_OPTIONS, ...customOptions];
    case 'qualification':
      return [...QUALIFICATION_OPTIONS, ...customOptions];
    case 'height':
      return [...HEIGHT_OPTIONS, ...customOptions];
    case 'gender':
      return [GENDERS.MALE, GENDERS.FEMALE, ...customOptions];
    case 'age':
      return [...AGE_OPTIONS, ...customOptions];
    case 'birthYear':
      return [...BIRTH_YEAR_OPTIONS, ...customOptions];
    case 'maritalStatus':
      return [...MARITAL_STATUS_OPTIONS, ...customOptions];
    case 'religion':
      return [...RELIGION_OPTIONS, ...customOptions];
    default:
      return customOptions;
  }
};
