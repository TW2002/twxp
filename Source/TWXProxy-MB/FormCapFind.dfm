object frmCapFind: TfrmCapFind
  Left = 261
  Top = 166
  BorderStyle = bsDialog
  Caption = 'Find Frames'
  ClientHeight = 73
  ClientWidth = 371
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'MS Sans Serif'
  Font.Style = []
  OldCreateOrder = False
  OnClose = FormClose
  PixelsPerInch = 96
  TextHeight = 13
  object Label1: TLabel
    Left = 8
    Top = 10
    Width = 58
    Height = 13
    Caption = 'Search Text'
  end
  object tbFind: TEdit
    Left = 80
    Top = 8
    Width = 201
    Height = 21
    TabOrder = 0
    OnKeyDown = tbFindKeyDown
  end
  object btnFind: TButton
    Left = 288
    Top = 8
    Width = 75
    Height = 25
    Caption = '&Find'
    TabOrder = 1
    OnClick = btnFindClick
  end
  object btnCancel: TButton
    Left = 288
    Top = 40
    Width = 75
    Height = 25
    Caption = '&Cancel'
    TabOrder = 2
    OnClick = btnCancelClick
  end
  object rbFromStart: TRadioButton
    Left = 24
    Top = 40
    Width = 113
    Height = 17
    Caption = 'From Start'
    Checked = True
    TabOrder = 3
    TabStop = True
  end
  object rbFromSelection: TRadioButton
    Left = 152
    Top = 40
    Width = 113
    Height = 17
    Caption = 'From Selection'
    TabOrder = 4
  end
end
