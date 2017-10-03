object frmCap: TfrmCap
  Left = 249
  Top = 107
  Caption = 'TWX Proxy Capture File Editor'
  ClientHeight = 395
  ClientWidth = 676
  Color = clBlack
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
    0000000000030000000000000000000000000000000300000000000000000000
    0000000000010000000000000000000000000000003130000000000000000000
    0000000003111300000000000000000000000000011B11000000000000000000
    0000000009BFB900000000000000000000000000087777000000000000000000
    0000000088888770000000000000000000000000888878700000000000000000
    00000008888F7887000000000000000000000888888F78887700000000000000
    00008888888F8888887000000000000000888888888888888887700000000000
    0888700088CC48700088870000000000088700008CCCC4700008870000000000
    087000008CCCC4700000870000000000087000008CCCC4700000870000000000
    087000008CECC4700000870000000000087000008CECC4800000870000000000
    087000008CCCCC8000008700000000000870000008CCC8000000870000000000
    00000000008C8000000000000000000000000000000800000000000000000000
    0000000000000000000000000000000000000000000000000000000000000000
    0000000000000000000000000000000000000000000000000000000000000000
    000000000000000000000000000000000000000000000000000000000000FFFF
    FFFFFFFFFFFFFFFEFFFFFFFEFFFFFFFEFFFFFFFC7FFFFFF83FFFFFF83FFFFFF8
    3FFFFFF83FFFFFF01FFFFFF01FFFFFE00FFFFF8003FFFF0001FFFC00007FF870
    1C3FF8F01E3FF9F01F3FF9F01F3FF9F01F3FF9F01F3FF9F01F3FF9F83F3FFFFC
    7FFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF}
  Menu = mnuMain
  OldCreateOrder = False
  PopupMenu = mnuPopup
  OnCreate = FormCreate
  OnMouseDown = FormMouseDown
  OnMouseWheel = FormMouseWheel
  OnPaint = FormPaint
  PixelsPerInch = 96
  TextHeight = 13
  object sbMain: TScrollBar
    Left = 660
    Top = 0
    Width = 16
    Height = 395
    Align = alRight
    Kind = sbVertical
    LargeChange = 10
    PageSize = 0
    TabOrder = 0
    OnScroll = sbMainScroll
  end
  object mnuMain: TMainMenu
    Left = 112
    Top = 80
    object miFile: TMenuItem
      Caption = '&File'
      object miOpen: TMenuItem
        Action = actOpen
      end
    end
    object miEdit: TMenuItem
      Caption = '&Edit'
      object miDelete: TMenuItem
        Action = actDelete
      end
      object miExport: TMenuItem
        Action = actExport
      end
      object miExportText: TMenuItem
        Action = actExportText
      end
      object miInsert: TMenuItem
        Action = actImport
      end
      object miFind: TMenuItem
        Action = actFind
      end
    end
  end
  object alMain: TActionList
    Left = 112
    Top = 120
    object actOpen: TAction
      Caption = '&Open ...'
      ShortCut = 16463
      OnExecute = actOpenExecute
    end
    object actDelete: TAction
      Caption = '&Delete frames'
      ShortCut = 16452
      Visible = False
      OnUpdate = actSelectUpdate
    end
    object actExport: TAction
      Caption = 'E&xport frames ...'
      ShortCut = 16453
      OnExecute = actExportExecute
      OnUpdate = actSelectUpdate
    end
    object actImport: TAction
      Caption = '&Import frames ...'
      ShortCut = 16457
      Visible = False
    end
    object actFind: TAction
      Caption = '&Find Frames ...'
      ShortCut = 16454
      OnExecute = actFindExecute
    end
    object actExportText: TAction
      Caption = 'Export frames as &Text ...'
      ShortCut = 16468
      OnExecute = actExportTextExecute
    end
  end
  object dlgOpen: TOpenDialog
    Filter = 'Capture files (*.cap)|*.cap|All files (*.*)|*.*'
    Left = 152
    Top = 80
  end
  object mnuPopup: TPopupMenu
    Left = 152
    Top = 120
    object Delete1: TMenuItem
      Action = actDelete
    end
    object Exportcapturefile1: TMenuItem
      Action = actExport
    end
    object ExportframesasText1: TMenuItem
      Action = actExportText
    end
    object Importcapturefile1: TMenuItem
      Action = actImport
    end
  end
  object dlgSave: TSaveDialog
    FileName = 'export.cap'
    Filter = 'Capture files (*.cap)|*.cap|All files (*.*)|*.*'
    Left = 232
    Top = 80
  end
  object dlgSaveText: TSaveDialog
    FileName = 'export.txt'
    Filter = 'Text files (*.txt)|*.txt|All files (*.*)|*.*'
    Left = 192
    Top = 80
  end
end
