object frmDebug: TfrmDebug
  Left = 251
  Top = 226
  Width = 549
  Height = 341
  AutoSize = True
  Caption = 'Active Triggers'
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'MS Sans Serif'
  Font.Style = []
  Icon.Data = {
    0000010001002020100000000000E80200001600000028000000200000004000
    0000010004000000000000020000000000000000000000000000000000000000
    000000008000008000000080800080000000800080008080000080808000C0C0
    C0000000FF0000FF000000FFFF00FF000000FF00FF00FFFF0000FFFFFF000000
    0000000000000000000000000000000000000000000000000000000000000000
    0000000000000000000000000000000000000000000000000000000000000000
    0000000000000000000000000000000000000000000000000000000000000000
    0000000000000000000000000000000000000000000000000000000000000000
    0000000000000000000000000000000000000000000000000000000000000009
    9100000009111110000991009910000991000000999999910009910099100009
    9100000999999999100991009990000991000009990910991000991999000009
    9100009910099009910099999900000991000099100990099100099990000009
    9100009910000009910000990000000991000099100000099100099910000009
    9100009910000009910099999100000991000099100000099100999991009999
    9111109910000009910991009910999999999099900000099909990099909999
    9999909990000009990999009990000000000000000000000000000000000000
    0000000000000000000000000000000000000000000000000000000000000000
    0000000000000000000000000000000000000000000000000000000000000000
    0000000000000000000000000000000000000000000000000000000000000000
    000000000000000000000000000000000000000000000000000000000000FFFF
    FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
    FFFFFFFFFFFFE3F81E31E3F00E31E3E00631E3E24703E3C66303E3C66387E3C7
    E3CFE3C7E387E3C7E303E3C7E3030047E2310047E2310047E231FFFFFFFFFFFF
    FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
  OldCreateOrder = False
  OnShow = FormShow
  PixelsPerInch = 96
  TextHeight = 13
  object Label1: TLabel
    Left = 112
    Top = 1
    Width = 34
    Height = 16
    Caption = 'Script'
    Font.Charset = DEFAULT_CHARSET
    Font.Color = clWindowText
    Font.Height = -13
    Font.Name = 'MS Sans Serif'
    Font.Style = []
    ParentFont = False
  end
  object Label2: TLabel
    Left = 0
    Top = 24
    Width = 28
    Height = 13
    Caption = 'Name'
  end
  object Label3: TLabel
    Left = 128
    Top = 24
    Width = 24
    Height = 13
    Caption = 'Type'
  end
  object Label4: TLabel
    Left = 200
    Top = 24
    Width = 26
    Height = 13
    Caption = 'Label'
  end
  object Label5: TLabel
    Left = 320
    Top = 24
    Width = 27
    Height = 13
    Caption = 'Value'
  end
  object cbScripts: TComboBox
    Left = 152
    Top = 0
    Width = 177
    Height = 21
    Style = csDropDownList
    ItemHeight = 13
    TabOrder = 0
    OnChange = cbScriptsChange
  end
  object lbTriggers: TListBox
    Left = 0
    Top = 41
    Width = 541
    Height = 273
    Align = alBottom
    Font.Charset = ANSI_CHARSET
    Font.Color = clWindowText
    Font.Height = -11
    Font.Name = 'Courier New'
    Font.Style = []
    ItemHeight = 14
    ParentFont = False
    TabOrder = 1
  end
end
