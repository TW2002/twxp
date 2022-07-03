object frmUpgrade: TfrmUpgrade
  Left = 341
  Top = 227
  Width = 356
  Height = 351
  Caption = 'Upgrade Registration'
  Color = clBtnFace
  Constraints.MaxHeight = 351
  Constraints.MaxWidth = 356
  Constraints.MinHeight = 351
  Constraints.MinWidth = 356
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'MS Sans Serif'
  Font.Style = []
  Icon.Data = {
    0000010001001010100000000000280100001600000028000000100000002000
    00000100040000000000C0000000000000000000000000000000000000000000
    000000008000008000000080800080000000800080008080000080808000C0C0
    C0000000FF0000FF000000FFFF00FF000000FF00FF00FFFF0000FFFFFF000000
    0000000000000000000000900000000000000099000000000099999990000FFF
    F099999999000FFFF099999999900F00F099999999000FFFF099999990000F00
    FFFFF09900000FFFFFFFF09000000F00F000000000000FFFF0FF000000000F08
    F0F0000000000FFFF0000000000000000000000000000000000000000000FFDF
    0000FFCF0000FFC7000000030000000100000000000000010000000300000007
    0000000F0000001F0000007F000000FF000001FF000003FF0000FFFF0000}
  OldCreateOrder = False
  OnCreate = FormCreate
  OnHide = FormHide
  OnShow = FormShow
  PixelsPerInch = 96
  TextHeight = 13
  object memHint2: TMemo
    Left = 3
    Top = 8
    Width = 342
    Height = 97
    TabStop = False
    Color = clAppWorkSpace
    Font.Charset = DEFAULT_CHARSET
    Font.Color = clWhite
    Font.Height = -11
    Font.Name = 'MS Sans Serif'
    Font.Style = []
    Lines.Strings = (
      
        'Enter your v1.0x registration user and key below.  These values ' +
        'are '
      'case sensitive and must be entered EXACTLY as shown.  Note that '
      
        'each key can only be upgraded once.  If you have a legit registr' +
        'ation '
      
        'and you experience problems with this, please email me immediate' +
        'ly '
      '(xide@clan.co.nz)')
    ParentFont = False
    ReadOnly = True
    TabOrder = 0
  end
  object pnlUpgrade: TPanel
    Left = 3
    Top = 112
    Width = 342
    Height = 177
    TabOrder = 1
    object lbUser: TLabel
      Left = 72
      Top = 43
      Width = 22
      Height = 13
      Caption = 'User'
    end
    object lbKey: TLabel
      Left = 72
      Top = 72
      Width = 18
      Height = 13
      Caption = 'Key'
    end
    object tbUser: TEdit
      Left = 112
      Top = 40
      Width = 161
      Height = 21
      TabOrder = 0
      Text = 'Unknown User'
    end
    object tbKey: TEdit
      Left = 112
      Top = 68
      Width = 161
      Height = 21
      TabOrder = 1
      Text = '0000000000-0000000000'
    end
    object btnUpgrade: TButton
      Left = 104
      Top = 128
      Width = 145
      Height = 25
      Caption = '&Upgrade Registration'
      TabOrder = 2
      OnClick = btnUpgradeClick
    end
  end
  object btnCancel: TButton
    Left = 270
    Top = 296
    Width = 75
    Height = 25
    Caption = '&Cancel'
    TabOrder = 2
    OnClick = btnCancelClick
  end
end
