object frmSetup: TfrmSetup
  Left = 263
  Top = 170
  AutoSize = True
  Caption = 'Setup'
  ClientHeight = 377
  ClientWidth = 369
  Color = clBtnFace
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
    00000000000000FFFFFFFFFFF000000F0F0F0F0F00000000FFFFFFF000000FF8
    00000008FF000F9FFFFFFFF000000FFFFFFFFFFFFF0000000000000000000000
    0000000000000000FFFFFFF000000000F00000F000000000F0AAE0F000000000
    F0DAD0F000000000F00000F000000000FFFFFFF0000000000000000000008003
    000080030000C00700000001000000010000000100000001000080030000E00F
    0000E00F0000E00F0000E00F0000E00F0000E00F0000E00F0000E00F0000}
  OldCreateOrder = False
  OnClose = FormClose
  OnHide = FormHide
  OnShow = FormShow
  PixelsPerInch = 96
  TextHeight = 13
  object PageControl: TPageControl
    Left = 0
    Top = 0
    Width = 369
    Height = 345
    ActivePage = tabServer
    TabOrder = 0
    OnChanging = PageControlChanging
    object tabServer: TTabSheet
      Caption = 'Server'
      object Panel1: TPanel
        Left = 22
        Top = 79
        Width = 313
        Height = 233
        TabOrder = 0
        object Label12: TLabel
          Left = 151
          Top = 73
          Width = 36
          Height = 13
          Caption = 'Sectors'
        end
        object Label3: TLabel
          Left = 8
          Top = 52
          Width = 53
          Height = 13
          Caption = 'Server Port'
        end
        object Label1: TLabel
          Left = 8
          Top = 31
          Width = 71
          Height = 13
          Caption = 'Server address'
        end
        object Label13: TLabel
          Left = 32
          Top = 118
          Width = 27
          Height = 13
          Caption = 'Script'
        end
        object Label14: TLabel
          Left = 32
          Top = 139
          Width = 57
          Height = 13
          Caption = 'Login Name'
        end
        object Label15: TLabel
          Left = 32
          Top = 161
          Width = 46
          Height = 13
          Caption = 'Password'
        end
        object Label16: TLabel
          Left = 32
          Top = 182
          Width = 28
          Height = 13
          Caption = 'Game'
        end
        object Label17: TLabel
          Left = 8
          Top = 10
          Width = 28
          Height = 13
          Caption = 'Name'
        end
        object Label23: TLabel
          Left = 8
          Top = 73
          Width = 64
          Height = 13
          Caption = 'Listening Port'
        end
        object Label2: TLabel
          Left = 172
          Top = 182
          Width = 45
          Height = 13
          Caption = 'Tray Icon'
        end
        object TrayImage: TImage
          Left = 224
          Top = 167
          Width = 32
          Height = 32
          OnClick = TrayImageClick
        end
        object tbHost: TEdit
          Left = 96
          Top = 28
          Width = 209
          Height = 21
          Enabled = False
          TabOrder = 1
          Text = '<Server>'
        end
        object tbPort: TEdit
          Left = 96
          Top = 49
          Width = 49
          Height = 21
          Enabled = False
          TabOrder = 2
          Text = '2002'
        end
        object tbSectors: TEdit
          Left = 193
          Top = 70
          Width = 49
          Height = 21
          Enabled = False
          TabOrder = 5
          Text = '5000'
        end
        object tbLoginScript: TEdit
          Left = 96
          Top = 116
          Width = 161
          Height = 21
          Enabled = False
          TabOrder = 7
        end
        object cbUseLogin: TCheckBox
          Left = 8
          Top = 96
          Width = 185
          Height = 17
          Caption = 'Use login script'
          Enabled = False
          TabOrder = 6
          OnClick = cbUseLoginClick
        end
        object tbLoginName: TEdit
          Left = 96
          Top = 137
          Width = 121
          Height = 21
          Enabled = False
          TabOrder = 8
        end
        object tbPassword: TEdit
          Left = 96
          Top = 158
          Width = 121
          Height = 21
          Enabled = False
          TabOrder = 9
        end
        object tbGame: TEdit
          Left = 96
          Top = 179
          Width = 49
          Height = 21
          Enabled = False
          TabOrder = 10
        end
        object tbDescription: TEdit
          Left = 96
          Top = 7
          Width = 209
          Height = 21
          Enabled = False
          TabOrder = 0
        end
        object btnSave: TButton
          Left = 80
          Top = 206
          Width = 65
          Height = 25
          Caption = '&OK'
          Enabled = False
          TabOrder = 11
          OnClick = btnSaveClick
        end
        object btnCancel: TButton
          Left = 168
          Top = 206
          Width = 65
          Height = 25
          Caption = '&Cancel'
          Enabled = False
          TabOrder = 12
          OnClick = btnCancelClick
        end
        object tbListenPort: TEdit
          Left = 96
          Top = 70
          Width = 49
          Height = 21
          Enabled = False
          TabOrder = 4
          Text = '2300'
        end
        object cbUseRLogin: TCheckBox
          Left = 151
          Top = 51
          Width = 98
          Height = 17
          Caption = 'Use RLogin'
          Enabled = False
          TabOrder = 3
          OnClick = cbUseLoginClick
        end
      end
      object cbGames: TComboBox
        Left = 64
        Top = 16
        Width = 209
        Height = 21
        ItemHeight = 13
        TabOrder = 1
        OnChange = cbGamesChange
      end
      object btnAdd: TButton
        Left = 64
        Top = 48
        Width = 65
        Height = 25
        Caption = '&Add'
        TabOrder = 2
        OnClick = btnAddClick
      end
      object btnDelete: TButton
        Left = 136
        Top = 48
        Width = 65
        Height = 25
        Caption = '&Delete'
        TabOrder = 3
        OnClick = btnDeleteClick
      end
      object btnEdit: TButton
        Left = 208
        Top = 48
        Width = 65
        Height = 25
        Caption = '&Edit'
        TabOrder = 4
        OnClick = btnEditClick
      end
    end
    object tabProgram: TTabSheet
      Caption = 'Program'
      ImageIndex = 4
      ExplicitLeft = 0
      ExplicitTop = 0
      ExplicitWidth = 0
      ExplicitHeight = 0
      object Label11: TLabel
        Left = 16
        Top = 48
        Width = 138
        Height = 13
        Caption = 'Terminal menu activation key'
      end
      object Label10: TLabel
        Left = 16
        Top = 67
        Width = 100
        Height = 13
        Caption = 'Maximum bubble size'
      end
      object Label21: TLabel
        Left = 32
        Top = 256
        Width = 79
        Height = 13
        Caption = 'External Address'
      end
      object Label22: TLabel
        Left = 212
        Top = 115
        Width = 43
        Height = 13
        Caption = 'seconds.'
      end
      object cbAcceptExternal: TCheckBox
        Left = 24
        Top = 230
        Width = 169
        Height = 17
        Caption = 'Accept external connections'
        TabOrder = 2
        OnClick = cbAcceptExternalClick
      end
      object cbBroadcast: TCheckBox
        Left = 24
        Top = 137
        Width = 241
        Height = 17
        Caption = 'Broadcast a message when a client connects'
        Checked = True
        State = cbChecked
        TabOrder = 3
      end
      object tbMenuKey: TEdit
        Left = 168
        Top = 46
        Width = 25
        Height = 21
        Font.Charset = DEFAULT_CHARSET
        Font.Color = clWindowText
        Font.Height = -11
        Font.Name = 'MS Sans Serif'
        Font.Style = [fsBold]
        ParentFont = False
        TabOrder = 0
        Text = '$'
        OnChange = tbMenuKeyChange
      end
      object cbReconnect: TCheckBox
        Left = 24
        Top = 114
        Width = 169
        Height = 17
        Caption = 'Automatically reconnect after'
        TabOrder = 4
      end
      object cbCache: TCheckBox
        Left = 24
        Top = 160
        Width = 209
        Height = 17
        Caption = 'Cache database in available memory'
        Checked = True
        State = cbChecked
        TabOrder = 5
      end
      object tbBubbleSize: TEdit
        Left = 168
        Top = 70
        Width = 57
        Height = 21
        TabOrder = 1
        Text = '30'
      end
      object cbLocalEcho: TCheckBox
        Left = 24
        Top = 184
        Width = 153
        Height = 17
        Caption = 'Local echo of outgoing text'
        TabOrder = 6
      end
      object tbExternalAddress: TEdit
        Left = 120
        Top = 253
        Width = 125
        Height = 21
        TabOrder = 7
      end
      object cbAllowLerkers: TCheckBox
        Left = 24
        Top = 207
        Width = 209
        Height = 17
        Caption = 'Allow Lerkers (View Only Connections)'
        TabOrder = 8
      end
      object tbReconnectDelay: TEdit
        Left = 184
        Top = 112
        Width = 25
        Height = 21
        Font.Charset = DEFAULT_CHARSET
        Font.Color = clWindowText
        Font.Height = -11
        Font.Name = 'MS Sans Serif'
        Font.Style = [fsBold]
        ParentFont = False
        TabOrder = 9
        Text = '15'
        OnChange = tbMenuKeyChange
      end
    end
    object tabLogging: TTabSheet
      Caption = 'Logging'
      ImageIndex = 5
      ExplicitLeft = 0
      ExplicitTop = 0
      ExplicitWidth = 0
      ExplicitHeight = 0
      object Label9: TLabel
        Left = 16
        Top = 112
        Width = 165
        Height = 13
        Caption = 'Shorten all playback delays above '
      end
      object Label20: TLabel
        Left = 230
        Top = 112
        Width = 40
        Height = 13
        Caption = 'seconds'
      end
      object cbLog: TCheckBox
        Left = 16
        Top = 16
        Width = 225
        Height = 17
        Caption = 'Log data according to selected database'
        TabOrder = 0
      end
      object cbLogANSI: TCheckBox
        Left = 48
        Top = 40
        Width = 161
        Height = 17
        Caption = 'Log ANSI codes'
        TabOrder = 1
      end
      object cbLogBinary: TCheckBox
        Left = 48
        Top = 64
        Width = 289
        Height = 17
        Caption = 'Log as binary (allows extra logging and capture features)'
        TabOrder = 2
      end
      object cbNotifyLogDelay: TCheckBox
        Left = 16
        Top = 144
        Width = 241
        Height = 17
        Caption = 'Notify when a delay has been shortened'
        TabOrder = 3
      end
      object tbShortenDelay: TEdit
        Left = 184
        Top = 110
        Width = 41
        Height = 21
        TabOrder = 4
        Text = '0'
      end
    end
    object tabAutoRun: TTabSheet
      Caption = 'Auto Run'
      ImageIndex = 3
      ExplicitLeft = 0
      ExplicitTop = 0
      ExplicitWidth = 0
      ExplicitHeight = 0
      object lbAutoRun: TListBox
        Left = 24
        Top = 96
        Width = 313
        Height = 193
        ItemHeight = 13
        TabOrder = 0
      end
      object memHint3: TMemo
        Left = 24
        Top = 8
        Width = 313
        Height = 33
        Color = clActiveBorder
        Lines.Strings = (
          
            'Add a script to the list below to make the script auto-launch on' +
            ' '
          'program startup')
        ReadOnly = True
        TabOrder = 1
      end
      object btnAddAutoRun: TButton
        Left = 80
        Top = 64
        Width = 89
        Height = 25
        Caption = '&Add Script'
        TabOrder = 2
        OnClick = btnAddAutoRunClick
      end
      object btnRemoveAutoRun: TButton
        Left = 184
        Top = 64
        Width = 89
        Height = 25
        Caption = '&Remove Script'
        TabOrder = 3
        OnClick = btnRemoveAutoRunClick
      end
    end
    object tabUser: TTabSheet
      Caption = 'Registration'
      ImageIndex = 5
      TabVisible = False
      ExplicitLeft = 0
      ExplicitTop = 0
      ExplicitWidth = 0
      ExplicitHeight = 0
      object Label18: TLabel
        Left = 48
        Top = 88
        Width = 36
        Height = 13
        Caption = 'User ID'
      end
      object Label19: TLabel
        Left = 48
        Top = 120
        Width = 77
        Height = 13
        Caption = 'Registration Key'
      end
      object Label4: TLabel
        Left = 72
        Top = 160
        Width = 233
        Height = 26
        Caption = 
          'Authenticate this key when TWX Proxy is loaded (Required for usa' +
          'ge)'
        WordWrap = True
      end
      object Label5: TLabel
        Left = 40
        Top = 248
        Width = 266
        Height = 26
        Caption = 
          'Note: Any registration keys for TWX Proxy v1.0x are not compatib' +
          'le with this version and must be upgraded first.'
        WordWrap = True
      end
      object memHint2: TMemo
        Left = 8
        Top = 8
        Width = 345
        Height = 57
        Color = clAppWorkSpace
        Font.Charset = DEFAULT_CHARSET
        Font.Color = clWhite
        Font.Height = -11
        Font.Name = 'MS Sans Serif'
        Font.Style = []
        Lines.Strings = (
          
            'Your user ID and registration key are required if you wish to ma' +
            'ke use of '
          
            'the powerful pack2 script subroutines.  You can obtain a registr' +
            'ation for '
          '$30 US at http://www.twxproxy.com')
        ParentFont = False
        ReadOnly = True
        TabOrder = 0
      end
      object tbUser: TEdit
        Left = 136
        Top = 84
        Width = 73
        Height = 21
        TabOrder = 1
        Text = '0000000000'
        OnChange = tbUserChange
      end
      object tbRegKey: TEdit
        Left = 136
        Top = 116
        Width = 137
        Height = 21
        TabOrder = 2
        OnChange = tbUserChange
      end
      object cbAuthenticate: TCheckBox
        Left = 48
        Top = 160
        Width = 17
        Height = 17
        TabOrder = 3
      end
      object btnUpgrade: TButton
        Left = 96
        Top = 280
        Width = 161
        Height = 25
        Caption = '&Upgrade Old Registration'
        TabOrder = 4
      end
    end
    object tabProxy: TTabSheet
      Caption = 'Auth Proxy'
      ImageIndex = 4
      TabVisible = False
      ExplicitLeft = 0
      ExplicitTop = 0
      ExplicitWidth = 0
      ExplicitHeight = 0
      object Label6: TLabel
        Left = 56
        Top = 24
        Width = 225
        Height = 13
        Caption = 'Use HTTP Proxy for Registration Authentication'
      end
      object Label7: TLabel
        Left = 40
        Top = 88
        Width = 67
        Height = 13
        Caption = 'Proxy Address'
      end
      object Label8: TLabel
        Left = 40
        Top = 120
        Width = 48
        Height = 13
        Caption = 'Proxy Port'
      end
      object cbUseAuthProxy: TCheckBox
        Left = 35
        Top = 23
        Width = 17
        Height = 17
        TabOrder = 0
      end
      object tbProxyAddress: TEdit
        Left = 128
        Top = 85
        Width = 121
        Height = 21
        Enabled = False
        TabOrder = 1
        OnChange = tbUserChange
      end
      object tbProxyPort: TEdit
        Left = 128
        Top = 116
        Width = 57
        Height = 21
        Enabled = False
        TabOrder = 2
        Text = '8080'
        OnChange = tbUserChange
      end
    end
  end
  object btnOKMain: TButton
    Left = 217
    Top = 351
    Width = 73
    Height = 25
    Caption = '&OK'
    TabOrder = 1
    OnClick = btnOKMainClick
  end
  object btnCancelMain: TButton
    Left = 296
    Top = 352
    Width = 73
    Height = 25
    Caption = '&Cancel'
    TabOrder = 2
    OnClick = btnCancelMainClick
  end
  object OpenDialog: TOpenDialog
    Filter = 'TW script (*.ts, *.ets, *.es)|*.ts;*.ets;*.cts'
    Left = 332
    Top = 24
  end
  object tmrReg: TTimer
    Enabled = False
    Interval = 10000
    OnTimer = tmrRegTimer
    Left = 336
    Top = 56
  end
end
