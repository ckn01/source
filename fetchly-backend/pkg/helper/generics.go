package helper

import (
	"encoding/json"
	"errors"
)

type FlexibleOperator[T1 any, T2 any] struct {
	OpType string
	Value  any
}

func (f *FlexibleOperator[T1, T2]) UnmarshalJSON(data []byte) error {
	var first T1
	if err := json.Unmarshal(data, &first); err == nil {
		f.OpType = "T1"
		f.Value = first
		return nil
	}

	var second T2
	if err := json.Unmarshal(data, &second); err == nil {
		f.OpType = "T2"
		f.Value = second
		return nil
	}

	return errors.New("invalid flexible operator type")
}

func (f FlexibleOperator[T1, T2]) AsT1() (T1, bool) {
	val, ok := f.Value.(T1)
	return val, ok
}

func (f FlexibleOperator[T1, T2]) AsT2() (T2, bool) {
	val, ok := f.Value.(T2)
	return val, ok
}

func NewFlexibleOperatorFromT1[T1 any, T2 any](val T1) FlexibleOperator[T1, T2] {
	return FlexibleOperator[T1, T2]{
		OpType: "T1",
		Value:  val,
	}
}

func NewFlexibleOperatorFromT2[T1 any, T2 any](val T2) FlexibleOperator[T1, T2] {
	return FlexibleOperator[T1, T2]{
		OpType: "T2",
		Value:  val,
	}
}

func (f FlexibleOperator[T1, T2]) IsEmpty() bool {
	// Check if the value is nil or if the OpType is not "T1" or "T2" or value is empty string
	return f.Value == nil || (f.OpType != "T1" && f.OpType != "T2")
}
