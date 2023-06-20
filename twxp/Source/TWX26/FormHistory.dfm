object frmHistory: TfrmHistory
  Left = 192
  Top = 127
  Width = 540
  Height = 365
  Caption = 'History'
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
    0000000000060000000000000000000000000000000600060000000000000000
    0000000000006060000600000000000000000600000066000006000000000000
    00000060000E60000000E0000000000000000060000E000000EE000000000000
    0000000E00E0000000E000000000000000000006EE0000000E00000000000000
    6006066000EE6000060000000000000006606000000006606000000000000000
    000FF6000FFFFFF60FF000FF00000000000FF0600FFFFFF06FFF00FF00000000
    000FF060FF0FF0FF60FF0FF000000000000FF006FF0000FF060FFF0000000000
    000FF006FF0000FF060FFF0000000000000FF0E0FF0000FF060FFF6600000000
    000FF0E0FF6000FF006FFF0060660000000FFE00FF0600FF000FFF0006000000
    000FFE00FF0066FF00FF0FF0000000000FFFFFF0FF0000FF0FF000FF00000000
    0FFFFFF0FF0000FF0FF000FF0000000000000E00000000006E00000000000000
    000060E00000000000EE0000000000000066000E00660000000E000000000000
    0600000E66006000000E6000000000000000000E000006000000E00000000000
    00000060000000600000E00000000000000000060000006000006E0000000000
    0000000060000006000000000000000000000000600000006000000000000000
    000000000000000000000000000000000000000000000000000000000000FFF8
    0FFFFFC001FFFF8000FFFE00003FFC00001FF800000FF0000007F0000007E000
    0003C0000001C0000001C0000001800000008000000080000000800000008000
    00008000000080000000C0000001C0000001C0000001E0000003F0000007F000
    0007F800000FFC00001FFE00003FFF8000FFFFC001FFFFF80FFFFFFFFFFF}
  Menu = mnuHistory
  OldCreateOrder = False
  OnResize = FormResize
  OnShow = FormShow
  PixelsPerInch = 96
  TextHeight = 13
  object memMsgHistory: TMemo
    Left = 0
    Top = 0
    Width = 532
    Height = 288
    Align = alClient
    Color = clBlack
    Font.Charset = ANSI_CHARSET
    Font.Color = clSilver
    Font.Height = -12
    Font.Name = 'MS Sans Serif'
    Font.Style = []
    ParentFont = False
    ReadOnly = True
    ScrollBars = ssVertical
    TabOrder = 0
  end
  object pnlHistory: TPanel
    Left = 0
    Top = 288
    Width = 532
    Height = 31
    Align = alBottom
    TabOrder = 1
    object rbMessages: TRadioButton
      Left = 8
      Top = 8
      Width = 73
      Height = 17
      Caption = 'Messages'
      Checked = True
      TabOrder = 0
      TabStop = True
      OnClick = rbClick
    end
    object btnClose: TButton
      Left = 448
      Top = 3
      Width = 81
      Height = 25
      Caption = '&Close'
      TabOrder = 1
      OnClick = btnCloseClick
    end
    object rbFighters: TRadioButton
      Left = 104
      Top = 8
      Width = 89
      Height = 17
      Caption = 'Fighters'
      TabOrder = 2
      OnClick = rbClick
    end
    object rbComputer: TRadioButton
      Left = 200
      Top = 8
      Width = 89
      Height = 17
      Caption = 'Computer'
      TabOrder = 3
      OnClick = rbClick
    end
    object btnClear: TButton
      Left = 364
      Top = 3
      Width = 81
      Height = 25
      Caption = 'C&lear'
      TabOrder = 4
      OnClick = btnClearClick
    end
  end
  object memFigHistory: TMemo
    Left = 0
    Top = 0
    Width = 532
    Height = 288
    Align = alClient
    Color = clBlack
    Font.Charset = ANSI_CHARSET
    Font.Color = clSilver
    Font.Height = -12
    Font.Name = 'MS Sans Serif'
    Font.Style = []
    ParentFont = False
    ReadOnly = True
    ScrollBars = ssVertical
    TabOrder = 2
    Visible = False
  end
  object memComHistory: TRichEdit
    Left = 0
    Top = 0
    Width = 532
    Height = 288
    Align = alClient
    Color = clBlack
    Font.Charset = DEFAULT_CHARSET
    Font.Color = clSilver
    Font.Height = -12
    Font.Name = 'MS Sans Serif'
    Font.Style = []
    ParentFont = False
    ReadOnly = True
    ScrollBars = ssVertical
    TabOrder = 3
    Visible = False
  end
  object mnuHistory: TMainMenu
    Left = 480
    Top = 32
    object View1: TMenuItem
      Caption = '&View'
      object miFont: TMenuItem
        Caption = '&Font...'
        OnClick = miFontClick
      end
      object miColour: TMenuItem
        Caption = 'Colour...'
        OnClick = miColourClick
      end
    end
  end
  object fntHistory: TFontDialog
    Font.Charset = DEFAULT_CHARSET
    Font.Color = clWindowText
    Font.Height = -11
    Font.Name = 'MS Sans Serif'
    Font.Style = []
    MinFontSize = 0
    MaxFontSize = 0
    Left = 480
    Top = 61
  end
  object clrHistory: TColorDialog
    Ctl3D = True
    Left = 480
    Top = 5
  end
end
