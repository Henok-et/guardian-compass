// Mock UN Sanctions list for demonstration purposes
// In production, this would be fetched from a real sanctions API or database

export const mockSanctionsList: string[] = [
  "Ahmad Al-Sharif",
  "Mohammed Hassan Ibrahim",
  "Fatima Abdullah Khan",
  "Omar Yusuf Ahmed",
  "Khalid Bin Rashid",
  "Ibrahim Al-Mansour",
  "Yasser Abdul-Rahman",
  "Tariq Hassan Ali",
  "Mustafa Karim Osman",
  "Jamal Abdel-Nasser",
  "Hussein Mohamed Farah",
  "Aisha Bint Khalil",
  "Salim Abdullah Noor",
  "Rashid Mohammed Said",
  "Nadia Ibrahim Hassan",
  "Abdul-Aziz Omar",
  "Kareem Al-Bukhari",
  "Layla Fatima Yusuf",
  "Samir Abdel-Hakim",
  "Zainab Ali Mohammed",
];

export function getSanctionsList(): string[] {
  return mockSanctionsList;
}
