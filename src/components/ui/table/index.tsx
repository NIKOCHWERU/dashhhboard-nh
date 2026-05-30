import React, { ReactNode } from "react";

// Props for Table
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

// Props for TableHeader
interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

// Props for TableBody
interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

// Props for TableRow
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

// Props for TableCell
interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  isHeader?: boolean;
}

// Table Component
const Table: React.FC<TableProps> = ({ children, className, ...props }) => {
  return (
    <div className="w-full overflow-x-auto max-w-full scrollbar-thin">
      <table className={`min-w-full ${className || ""}`} {...props}>{children}</table>
    </div>
  );
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className, ...props }) => {
  return <thead className={className} {...props}>{children}</thead>;
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className, ...props }) => {
  return <tbody className={className} {...props}>{children}</tbody>;
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className, ...props }) => {
  return <tr className={className} {...props}>{children}</tr>;
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className,
  ...props
}) => {
  const CellTag = isHeader ? "th" : "td";
  return (
    <CellTag className={`break-words whitespace-normal text-xs md:text-sm ${className || ""}`} {...props}>
      {children}
    </CellTag>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
