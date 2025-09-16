import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface DataRow {
  [key: string]: any
}

type Props = {
  data: DataRow[];
  fileName: string;
  buttonName: string;
  id?: string;
};

export default function ExcelDownloadButton({ data, fileName, buttonName, id }: Props) {
  const handleDownloadClick = () => {
    // データが空の場合は何もしない
    if (data.length === 0) {
      alert("ダウンロードするデータがありません");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${fileName}.xlsx`);
  };

  return (
    <button onClick={handleDownloadClick} id={id}>
      {buttonName}
    </button>
  );
}