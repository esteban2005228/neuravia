import type { Kinship, StudyArea } from "@/lib/supabase/database.types";

export const KINSHIP_LABEL: Record<Kinship, string> = {
  mother: "Madre",
  father: "Padre",
  child: "Hijo/a",
  sibling: "Hermano/a",
  partner: "Pareja",
  grandparent: "Abuelo/a",
  uncle_aunt: "Tío/a",
  cousin: "Primo/a",
  other: "Otro",
};

export const STUDY_AREA_LABEL: Record<StudyArea, string> = {
  clinical_psychology: "Psicología clínica",
  neuropsychology: "Neuropsicología",
  psychiatry: "Psiquiatría",
  neurology: "Neurología",
  general_medicine: "Medicina general",
  psychology_student: "Estudiante de psicología",
  other: "Otra",
};

export const MAX_RELATIVES = 2;
