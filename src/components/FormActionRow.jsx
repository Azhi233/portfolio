function FormActionRow({ className = '', children }) {
  return <div className={`md:col-span-2 flex justify-end gap-2 ${className}`.trim()}>{children}</div>;
}

export default FormActionRow;
