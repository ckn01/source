package helper

import (
	"fmt"
	"log"

	"encoding/base64"

	"github.com/360EntSecGroup-Skylar/excelize"
)

func GenerateXLSX(headerList []string, records []map[int32]string) (base64XLSXString string, err error) {
	xlsx := excelize.NewFile()
	sheet1Name := "Sheet One"
	xlsx.SetSheetName(xlsx.GetSheetName(1), sheet1Name)

	// construt header names
	for i := 0; i < len(headerList); i++ {
		xlsx.SetCellValue(sheet1Name, fmt.Sprintf("%s1", excelize.ToAlphaString(i)), headerList[i])
	}

	err = xlsx.AutoFilter(sheet1Name, "A1", "Z1", "")
	if err != nil {
		log.Printf("error at GenerateXLSX. Detail: %v", err)
	}

	for rowIndex := 0; rowIndex < len(records); rowIndex++ {
		record := records[rowIndex]

		for colIndex := 0; colIndex < len(record); colIndex++ {
			xlsx.SetCellValue(sheet1Name, fmt.Sprintf("%s%d", excelize.ToAlphaString(colIndex), rowIndex+2), record[int32(colIndex)])
		}
	}

	fileBuffer, err := xlsx.WriteToBuffer()
	if err != nil {
		log.Print(err.Error())
	}
	base64Output := base64.StdEncoding.EncodeToString(fileBuffer.Bytes())
	base64XLSXString = `data:application/vnd.ms-excel;base64,` + base64Output

	return
}
