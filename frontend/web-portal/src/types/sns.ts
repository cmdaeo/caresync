export type ParsedMedication = {
  index?: number;
  drug_name?: string;
  dose_mg?: number | string | null;
  doses_mg?: Array<number>;
  form?: string | null;
  units_in_box?: number | null;
  is_sos?: boolean | null;
  duration_days?: number | null;
  duration_months?: number | null;
  times_per_day?: number | null;
  interval_hours?: number | null;
  quantity_prescribed?: number | null;
  valid_until?: string | null;
  raw_title?: string | null;
  raw_notes?: string | null;
};
