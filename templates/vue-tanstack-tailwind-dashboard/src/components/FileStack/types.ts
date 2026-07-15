export interface FileStackListItem {
  id: string | number;
  name: string;
  size?: number | string | null;
  type?: string | null;
  disabled?: boolean;
}

export interface DisplayFile extends FileStackListItem {
  extension: string;
  sizeLabel: string;
  toneClass: string;
}
