object frmSetup: TfrmSetup
  Left = 263
  Top = 170
  AutoSize = True
  BorderStyle = bsDialog
  Caption = 'Setup'
<<<<<<< HEAD
  ClientHeight = 404
  ClientWidth = 561
=======
  ClientHeight = 377
  ClientWidth = 369
>>>>>>> parent of f15a929... Added Login information to setup form.
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
  Padding.Left = 10
  Padding.Top = 10
  Padding.Right = 10
  Padding.Bottom = 10
  OldCreateOrder = False
  OnHide = FormHide
  OnShow = FormShow
  PixelsPerInch = 96
  TextHeight = 13
<<<<<<< HEAD
  object Label22: TLabel
    Left = 25
    Top = 15
    Width = 46
    Height = 13
    Caption = 'Database'
  end
  object Label37: TLabel
    Left = 241
    Top = 43
    Width = 6
    Height = 13
    Caption = '0'
  end
  object Label38: TLabel
    Left = 241
    Top = 62
    Width = 6
    Height = 13
    Caption = '0'
  end
  object panMain: TPanel
    Left = 10
    Top = 41
    Width = 541
    Height = 322
    TabOrder = 4
    object tvMain: TTreeView
      Left = 10
      Top = 10
      Width = 175
      Height = 300
      Indent = 19
      TabOrder = 0
      Items.NodeData = {
        0103000000270000000000000000000000FFFFFFFFFFFFFFFF00000000030000
        0007530065007300730069006F006E00230000000000000000000000FFFFFFFF
        FFFFFFFF0000000000000000054C006F00670069006E00270000000000000000
        000000FFFFFFFFFFFFFFFF0000000000000000074F007000740069006F006E00
        7300210000000000000000000000FFFFFFFFFFFFFFFF00000000000000000443
        006F0072007000290000000000000000000000FFFFFFFFFFFFFFFF0000000002
        000000085400650072006D0069006E0061006C00270000000000000000000000
        FFFFFFFFFFFFFFFF0000000000000000074C006F006700670069006E00670027
        0000000000000000000000FFFFFFFFFFFFFFFF00000000000000000741007500
        74006F00520075006E002D0000000000000000000000FFFFFFFFFFFFFFFF0000
        0000000000000A5300740061007400690073007400690063007300}
    end
  end
  object panLogin: TPanel
    Left = 201
    Top = 51
    Width = 340
    Height = 300
    Caption = '`1+'
    TabOrder = 11
    object GroupBox17: TGroupBox
      Left = 10
      Top = 10
      Width = 320
      Height = 105
      Caption = 'Login'
      TabOrder = 0
      object cc: TLabel
        Left = 62
        Top = 47
        Width = 27
        Height = 13
        Caption = 'Script'
      end
      object Label43: TLabel
        Left = 37
        Top = 75
        Width = 53
        Height = 13
        Caption = 'Default Bot'
      end
      object tbLoginScript: TEdit
        Left = 95
        Top = 44
        Width = 175
        Height = 21
        Enabled = False
        TabOrder = 1
      end
      object cbUseLogin: TCheckBox
        Left = 21
        Top = 21
        Width = 185
        Height = 17
        Caption = 'Use Login Script.'
        TabOrder = 0
        OnClick = cbUseLoginClick
      end
      object tbDefaultBot: TEdit
        Left = 95
        Top = 72
        Width = 175
        Height = 21
        Hint = 'Get your passport from ClassicTW.com (i.e. 001-AB-777)'
        TabOrder = 2
      end
    end
    object GroupBox4: TGroupBox
      Left = 11
      Top = 121
      Width = 320
      Height = 161
      Caption = 'Identity'
      TabOrder = 1
      object Label13: TLabel
        Left = 32
        Top = 25
        Width = 57
        Height = 13
        Caption = 'Login Name'
      end
      object Label15: TLabel
        Left = 43
        Top = 52
        Width = 46
        Height = 13
        Caption = 'Password'
      end
      object Label23: TLabel
        Left = 67
        Top = 79
        Width = 22
        Height = 13
        Caption = 'Alias'
      end
      object Label32: TLabel
        Left = 25
        Top = 133
        Width = 64
        Height = 13
        Caption = 'Private Game'
      end
      object Label33: TLabel
        Left = 27
        Top = 106
        Width = 62
        Height = 13
        Caption = 'TW Passport'
      end
      object tbLoginName: TEdit
        Left = 95
        Top = 22
        Width = 120
        Height = 21
        TabOrder = 0
      end
      object tbPassword: TEdit
        Left = 95
        Top = 49
        Width = 120
=======
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
        Left = 24
        Top = 80
        Width = 313
        Height = 233
        TabOrder = 0
        object Label12: TLabel
          Left = 8
          Top = 73
          Width = 36
          Height = 13
          Caption = 'Sectors'
        end
        object Label3: TLabel
          Left = 8
          Top = 51
          Width = 19
          Height = 13
          Caption = 'Port'
        end
        object Label1: TLabel
          Left = 8
          Top = 30
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
          Top = 9
          Width = 28
          Height = 13
          Caption = 'Name'
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
          Width = 41
          Height = 21
          Enabled = False
          TabOrder = 2
          Text = '23'
        end
        object tbSectors: TEdit
          Left = 96
          Top = 70
          Width = 161
          Height = 21
          Enabled = False
          TabOrder = 3
          Text = '5000'
        end
        object tbLoginScript: TEdit
          Left = 96
          Top = 116
          Width = 161
          Height = 21
          Enabled = False
          TabOrder = 5
        end
        object cbUseLogin: TCheckBox
          Left = 8
          Top = 96
          Width = 185
          Height = 17
          Caption = 'Use login script'
          Enabled = False
          TabOrder = 4
          OnClick = cbUseLoginClick
        end
        object tbLoginName: TEdit
          Left = 96
          Top = 137
          Width = 121
          Height = 21
          Enabled = False
          TabOrder = 6
        end
        object tbPassword: TEdit
          Left = 96
          Top = 158
          Width = 121
          Height = 21
          Enabled = False
          TabOrder = 7
        end
        object tbGame: TEdit
          Left = 96
          Top = 179
          Width = 25
          Height = 21
          Enabled = False
          TabOrder = 8
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
          Left = 88
          Top = 206
          Width = 65
          Height = 25
          Caption = '&OK'
          Enabled = False
          TabOrder = 9
          OnClick = btnSaveClick
        end
        object btnCancel: TButton
          Left = 168
          Top = 206
          Width = 65
          Height = 25
          Caption = '&Cancel'
          Enabled = False
          TabOrder = 10
          OnClick = btnCancelClick
        end
      end
      object cbGames: TComboBox
        Left = 64
        Top = 16
        Width = 209
>>>>>>> parent of f15a929... Added Login information to setup form.
        Height = 21
        TabOrder = 1
      end
<<<<<<< HEAD
      object tbAlias: TEdit
        Left = 95
        Top = 76
        Width = 120
        Height = 21
=======
      object btnAdd: TButton
        Left = 64
        Top = 48
        Width = 65
        Height = 25
        Caption = '&Add'
>>>>>>> parent of f15a929... Added Login information to setup form.
        TabOrder = 2
      end
<<<<<<< HEAD
      object tbPrivateGame: TEdit
        Left = 95
        Top = 130
        Width = 120
        Height = 21
        Hint = 'Password required to enter a private game.'
        TabOrder = 4
      end
      object tbPassport: TEdit
        Left = 95
        Top = 103
        Width = 120
        Height = 21
        Hint = 'Get your passport from ClassicTW.com (i.e. 001-AB-777)'
=======
      object btnDelete: TButton
        Left = 136
        Top = 48
        Width = 65
        Height = 25
        Caption = '&Delete'
>>>>>>> parent of f15a929... Added Login information to setup form.
        TabOrder = 3
      end
<<<<<<< HEAD
    end
  end
  object panAutoRun: TPanel
    Left = 201
    Top = 52
    Width = 340
    Height = 300
    Caption = 'panAutoRun'
    TabOrder = 9
    object GroupBox11: TGroupBox
      Left = 12
      Top = 18
      Width = 320
      Height = 246
      Caption = 'AutoRun'
      TabOrder = 0
      object lbAutoRun: TListBox
        Left = 14
        Top = 27
        Width = 286
        Height = 180
        ItemHeight = 13
        TabOrder = 0
      end
      object btnAddAutoRun: TButton
        Left = 27
        Top = 213
        Width = 89
=======
      object btnEdit: TButton
        Left = 208
        Top = 48
        Width = 65
>>>>>>> parent of f15a929... Added Login information to setup form.
        Height = 25
        Caption = '&Add Script'
        TabOrder = 1
        OnClick = btnAddAutoRunClick
      end
      object btnRemoveAutoRun: TButton
        Left = 122
        Top = 213
        Width = 89
        Height = 25
        Caption = '&Remove Script'
        TabOrder = 2
        OnClick = btnRemoveAutoRunClick
      end
    end
  end
  object panLogging: TPanel
    Left = 201
    Top = 52
    Width = 340
    Height = 300
    Caption = 'panLogging'
    TabOrder = 10
    object GroupBox16: TGroupBox
      Left = 11
      Top = 15
      Width = 320
      Height = 162
      Caption = 'Logging'
      TabOrder = 0
      object Label9: TLabel
        Left = 21
        Top = 101
        Width = 165
        Height = 13
        Caption = 'Shorten all playback delays above '
      end
      object Label20: TLabel
        Left = 239
        Top = 101
        Width = 40
        Height = 13
        Caption = 'seconds'
      end
      object cbLog: TCheckBox
        Left = 21
        Top = 27
        Width = 225
        Height = 17
        Caption = 'Log data according to selected database'
        TabOrder = 0
      end
      object cbLogANSI: TCheckBox
        Left = 56
        Top = 50
        Width = 150
        Height = 17
        Caption = 'Log ANSI codes'
        TabOrder = 1
      end
      object cbLogBinary: TCheckBox
        Left = 55
        Top = 73
        Width = 150
        Height = 17
        Caption = 'Log as binary'
        TabOrder = 2
      end
      object cbNotifyLogDelay: TCheckBox
        Left = 21
        Top = 123
        Width = 241
        Height = 17
        Caption = 'Notify when a delay has been shortened'
        TabOrder = 4
      end
      object tbShortenDelay: TEdit
        Left = 192
        Top = 98
        Width = 41
        Height = 21
        TabOrder = 3
        Text = '0'
      end
    end
<<<<<<< HEAD
  end
  object panStats: TPanel
    Left = 201
    Top = 52
    Width = 340
    Height = 300
    TabOrder = 7
    object GroupBox18: TGroupBox
      Left = 10
      Top = 10
      Width = 320
      Height = 90
      Caption = 'Statistics'
      TabOrder = 0
      object Label25: TLabel
        Left = 31
        Top = 22
        Width = 64
        Height = 13
        Caption = 'Total Warps :'
      end
      object Label26: TLabel
        Left = 44
        Top = 41
        Width = 51
        Height = 13
        Caption = 'One-Way :'
      end
      object Label27: TLabel
        Left = 43
        Top = 60
        Width = 52
        Height = 13
        Caption = 'Two-Way :'
      end
      object Label28: TLabel
        Left = 177
        Top = 22
        Width = 49
        Height = 13
        Caption = 'Stardock :'
      end
      object Label29: TLabel
        Left = 167
        Top = 41
        Width = 59
        Height = 13
        Caption = 'Dead Ends :'
      end
      object Label30: TLabel
        Left = 182
        Top = 60
        Width = 44
        Height = 13
        Caption = 'Bubbles :'
      end
      object Label31: TLabel
        Left = 240
        Top = 22
        Width = 6
        Height = 13
        Caption = '0'
      end
      object Label34: TLabel
        Left = 240
        Top = 41
        Width = 6
        Height = 13
        Caption = '0'
      end
      object Label35: TLabel
        Left = 240
        Top = 60
        Width = 6
        Height = 13
        Caption = '0'
      end
      object Label39: TLabel
        Left = 101
        Top = 22
        Width = 6
        Height = 13
        Caption = '0'
      end
      object Label40: TLabel
        Left = 101
        Top = 41
        Width = 6
        Height = 13
        Caption = '0'
      end
      object Label41: TLabel
        Left = 101
        Top = 60
        Width = 6
        Height = 13
        Caption = '0'
      end
    end
  end
  object panTerminal: TPanel
    Left = 201
    Top = 52
    Width = 340
    Height = 300
    Caption = 'panTerminal'
    TabOrder = 8
    object GroupBox9: TGroupBox
      Left = 11
      Top = 10
      Width = 320
      Height = 208
      Caption = 'Terminal'
      TabOrder = 0
      object Label11: TLabel
        Left = 27
        Top = 26
        Width = 138
        Height = 13
        Caption = 'Terminal menu activation key'
      end
      object Label10: TLabel
        Left = 37
        Top = 122
        Width = 100
        Height = 13
        Caption = 'Maximum bubble size'
      end
      object Label21: TLabel
        Left = 44
        Top = 170
        Width = 81
        Height = 13
        Caption = 'Remote Address '
      end
      object cbBroadcast: TCheckBox
        Left = 27
        Top = 51
        Width = 241
        Height = 17
        Caption = 'Broadcast a message when a client connects'
        Checked = True
        State = cbChecked
        TabOrder = 0
      end
      object tbMenuKey: TEdit
        Left = 179
        Top = 24
        Width = 25
        Height = 21
        Font.Charset = DEFAULT_CHARSET
        Font.Color = clWindowText
        Font.Height = -11
        Font.Name = 'MS Sans Serif'
        Font.Style = [fsBold]
        ParentFont = False
        TabOrder = 1
        Text = '$'
        OnChange = tbMenuKeyChange
      end
      object cbCache: TCheckBox
        Left = 27
        Top = 74
        Width = 209
        Height = 17
        Caption = 'Cache database in available memory'
        Checked = True
        State = cbChecked
        TabOrder = 2
      end
      object tbBubbleSize: TEdit
        Left = 147
        Top = 119
        Width = 57
        Height = 21
        TabOrder = 3
        Text = '30'
      end
      object cbLocalEcho: TCheckBox
        Left = 27
        Top = 97
        Width = 153
        Height = 17
        Caption = 'Local echo of outgoing text'
        TabOrder = 4
      end
      object cbAcceptExternal: TCheckBox
        Left = 28
        Top = 147
        Width = 169
        Height = 17
        Caption = 'Accept external connections'
        TabOrder = 5
      end
      object tbRemoteAddress: TEdit
        Left = 131
        Top = 167
        Width = 114
        Height = 21
        Enabled = False
        TabOrder = 6
      end
    end
  end
  object panCorp: TPanel
    Left = 201
    Top = 52
    Width = 340
    Height = 300
    Caption = 'panCorp'
    TabOrder = 5
    object GroupBox7: TGroupBox
      Left = 10
      Top = 10
      Width = 320
      Height = 122
      Caption = 'Corporation'
      TabOrder = 0
      object Label14: TLabel
        Left = 53
        Top = 86
        Width = 46
        Height = 13
        Caption = 'Password'
      end
      object Label42: TLabel
        Left = 46
        Top = 59
        Width = 53
        Height = 13
        Caption = 'Corp Name'
      end
      object tbCorpPassword: TEdit
        Left = 105
        Top = 83
        Width = 121
        Height = 21
        Enabled = False
        TabOrder = 3
      end
      object tbCorpName: TEdit
        Left = 105
        Top = 56
        Width = 121
        Height = 21
        Enabled = False
        TabOrder = 2
      end
      object cbJoinCorp: TCheckBox
        Left = 27
        Top = 36
        Width = 185
        Height = 17
        Caption = 'Join Corporatiopn'
        TabOrder = 1
      end
      object cbCreateCorp: TCheckBox
        Left = 27
        Top = 18
        Width = 201
        Height = 17
        Caption = 'Create Corporation (CEO)'
        TabOrder = 0
      end
    end
    object GroupBox5: TGroupBox
      Left = 10
      Top = 141
      Width = 320
      Height = 101
      Caption = 'After Login'
      TabOrder = 1
      object Label36: TLabel
        Left = 27
        Top = 27
        Width = 30
        Height = 13
        Caption = 'Action'
      end
      object Label24: TLabel
        Left = 25
        Top = 54
        Width = 31
        Height = 13
        Caption = 'Option'
      end
      object lbPostHint: TLabel
        Left = 36
        Top = 73
        Width = 216
        Height = 13
        Caption = 'Enter as sectror number, or class 0 port name.'
      end
      object cbPostAction: TComboBox
        Left = 62
        Top = 24
        Width = 195
        Height = 21
        ItemHeight = 13
        TabOrder = 0
        OnChange = cbGamesChange
      end
      object tbPostOption: TEdit
        Left = 62
        Top = 51
        Width = 121
        Height = 21
        Enabled = False
        TabOrder = 1
      end
    end
  end
  object panOptions: TPanel
    Left = 201
    Top = 52
    Width = 340
    Height = 300
    Caption = 'panOptions'
    TabOrder = 12
    object GroupBox15: TGroupBox
      Left = 10
      Top = 12
      Width = 320
      Height = 204
      Caption = 'Options'
      TabOrder = 0
      object Label44: TLabel
        Left = 35
        Top = 25
        Width = 52
        Height = 13
        Caption = 'Ship Name'
      end
      object Label45: TLabel
        Left = 26
        Top = 52
        Width = 61
        Height = 13
        Caption = 'Home Planet'
      end
      object Label46: TLabel
        Left = 39
        Top = 79
        Width = 48
        Height = 13
        Caption = 'Subspace'
      end
      object cbClearAvoids: TCheckBox
        Left = 174
        Top = 173
        Width = 102
        Height = 17
        Caption = 'Clear Avoids.'
        TabOrder = 6
        OnClick = cbUseLoginClick
      end
      object cbClearMessages: TCheckBox
        Left = 174
        Top = 150
        Width = 115
        Height = 17
        Caption = 'Clear Messages.'
        TabOrder = 5
        OnClick = cbUseLoginClick
      end
      object cbReadLog: TCheckBox
        Left = 28
        Top = 150
        Width = 123
        Height = 17
        Caption = 'Read Today'#39's Log.'
        TabOrder = 2
        OnClick = cbUseLoginClick
      end
      object cbStopBefore: TCheckBox
        Left = 174
        Top = 127
        Width = 115
        Height = 17
        Caption = 'Stop at '#39'T'#39' Menu.'
        TabOrder = 4
        OnClick = cbUseLoginClick
      end
      object cbGetSettings: TCheckBox
        Left = 28
        Top = 127
        Width = 126
        Height = 17
        Caption = 'Always get settings.'
        TabOrder = 1
        OnClick = cbUseLoginClick
      end
      object cbLandOnTerra: TCheckBox
        Left = 28
        Top = 107
        Width = 185
        Height = 17
        Caption = 'Land on Terra unless Fedsafe.'
        TabOrder = 0
        OnClick = cbUseLoginClick
      end
      object cbReadMessages: TCheckBox
        Left = 29
        Top = 173
        Width = 123
        Height = 17
        Caption = 'Read Offline Messages.'
        TabOrder = 3
        OnClick = cbUseLoginClick
      end
      object tbShipName: TEdit
        Left = 93
        Top = 22
        Width = 121
        Height = 21
        TabOrder = 7
      end
      object tbHomePlanet: TEdit
        Left = 93
        Top = 49
        Width = 121
        Height = 21
        TabOrder = 8
      end
      object tbSubSpace: TEdit
        Left = 93
        Top = 76
        Width = 121
        Height = 21
        TabOrder = 9
      end
    end
  end
  object panSession: TPanel
    Left = 201
    Top = 52
    Width = 340
    Height = 300
    Caption = 'panSession'
    TabOrder = 6
    object GroupBox1: TGroupBox
      Left = 10
      Top = 11
      Width = 320
      Height = 79
      Caption = 'Database'
      TabOrder = 0
      object Label12: TLabel
        Left = 54
        Top = 47
        Width = 36
        Height = 13
        Caption = 'Sectors'
      end
      object Label17: TLabel
        Left = 62
        Top = 20
        Width = 28
        Height = 13
        Caption = 'Name'
      end
      object tbDescription: TEdit
        Left = 96
        Top = 17
        Width = 200
        Height = 21
        Enabled = False
        TabOrder = 0
      end
      object tbSectors: TEdit
        Left = 96
        Top = 44
        Width = 100
        Height = 21
        Enabled = False
        TabOrder = 1
        Text = '30000'
      end
    end
    object GroupBox2: TGroupBox
      Left = 10
      Top = 92
      Width = 320
      Height = 194
      Caption = 'Server'
      TabOrder = 1
      object Label1: TLabel
        Left = 52
        Top = 22
        Width = 38
=======
    object tabProgram: TTabSheet
      Caption = 'Program'
      ImageIndex = 4
      object Label2: TLabel
        Left = 16
        Top = 24
        Width = 140
        Height = 13
        Caption = 'Listen for connections on port'
      end
      object Label11: TLabel
        Left = 16
        Top = 48
        Width = 138
        Height = 13
        Caption = 'Terminal menu activation key'
      end
      object Label10: TLabel
        Left = 16
        Top = 72
        Width = 100
        Height = 13
        Caption = 'Maximum bubble size'
      end
      object Label21: TLabel
        Left = 40
        Top = 135
        Width = 81
        Height = 13
        Caption = 'Remote Address '
      end
      object cbAcceptExternal: TCheckBox
        Left = 16
        Top = 112
        Width = 169
        Height = 17
        Caption = 'Accept external connections'
        TabOrder = 3
        OnClick = cbAcceptExternalClick
      end
      object cbBroadcast: TCheckBox
        Left = 16
        Top = 159
        Width = 241
        Height = 17
        Caption = 'Broadcast a message when a client connects'
        Checked = True
        State = cbChecked
        TabOrder = 5
      end
      object tbListenPort: TEdit
        Left = 168
        Top = 22
        Width = 57
        Height = 21
        TabOrder = 0
        Text = '23'
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
        TabOrder = 1
        Text = '$'
        OnChange = tbMenuKeyChange
      end
      object cbReconnect: TCheckBox
        Left = 16
        Top = 183
        Width = 169
        Height = 17
        Caption = 'Automatically reconnect'
        TabOrder = 6
      end
      object cbCache: TCheckBox
        Left = 16
        Top = 207
        Width = 209
        Height = 17
        Caption = 'Cache database in available memory'
        Checked = True
        State = cbChecked
        TabOrder = 7
      end
      object tbBubbleSize: TEdit
        Left = 168
        Top = 70
        Width = 57
        Height = 21
        TabOrder = 2
        Text = '30'
      end
      object cbLocalEcho: TCheckBox
        Left = 16
        Top = 231
        Width = 153
        Height = 17
        Caption = 'Local echo of outgoing text'
        TabOrder = 8
      end
      object tbRemoteAddress: TEdit
        Left = 127
        Top = 132
        Width = 114
        Height = 21
        Enabled = False
        TabOrder = 4
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
>>>>>>> parent of f15a929... Added Login information to setup form.
        Height = 13
        Caption = 'Address'
      end
<<<<<<< HEAD
      object Label3: TLabel
        Left = 71
        Top = 49
        Width = 19
=======
      object Label20: TLabel
        Left = 230
        Top = 112
        Width = 40
>>>>>>> parent of f15a929... Added Login information to setup form.
        Height = 13
        Caption = 'Port'
      end
<<<<<<< HEAD
      object Label16: TLabel
        Left = 62
        Top = 76
        Width = 28
        Height = 13
        Caption = 'Game'
      end
      object Label2: TLabel
        Left = 32
        Top = 103
        Width = 140
        Height = 13
        Caption = 'Listen for connections on port'
      end
      object lbCountdown: TLabel
        Left = 1
        Top = 170
        Width = 319
        Height = 13
        Alignment = taCenter
        AutoSize = False
        Caption = 'Game starts in 1 hour and 15 minutes.'
        Layout = tlCenter
        Visible = False
      end
      object tbHost: TEdit
        Left = 96
        Top = 19
        Width = 200
        Height = 21
        TabOrder = 0
      end
      object tbPort: TEdit
        Left = 96
        Top = 46
        Width = 50
        Height = 21
=======
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
>>>>>>> parent of f15a929... Added Login information to setup form.
        TabOrder = 1
        Text = '2002'
      end
<<<<<<< HEAD
      object tbGame: TEdit
        Left = 96
        Top = 73
        Width = 50
=======
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
>>>>>>> parent of f15a929... Added Login information to setup form.
        Height = 21
        TabOrder = 2
      end
<<<<<<< HEAD
      object tbListenPort: TEdit
        Left = 184
        Top = 101
        Width = 57
        Height = 21
        TabOrder = 3
        Text = '3000'
      end
      object dtStartTime: TDateTimePicker
        Left = 212
        Top = 147
        Width = 91
        Height = 21
        Date = 43000.213973483800000000
        Time = 43000.213973483800000000
        DateMode = dmUpDown
        Kind = dtkTime
        ParseInput = True
        TabOrder = 6
        Visible = False
      end
      object cbDelayedStart: TCheckBox
        Left = 19
        Top = 149
        Width = 87
        Height = 17
        Caption = 'Delayed Start'
        TabOrder = 4
      end
      object dtStartDate: TDateTimePicker
        Left = 113
        Top = 147
        Width = 91
        Height = 21
        Date = 43000.213973483800000000
        Time = 43000.213973483800000000
        DateMode = dmUpDown
        ParseInput = True
        TabOrder = 7
        Visible = False
      end
      object cbReconnect: TCheckBox
        Left = 19
        Top = 124
        Width = 169
        Height = 17
        Caption = 'Automatically reconnect'
        TabOrder = 5
      end
=======
>>>>>>> parent of f15a929... Added Login information to setup form.
    end
  end
  object PageControl: TPageControl
    Left = 396
    Top = 10
    Width = 154
    Height = 62
    ActivePage = tabServer
    Enabled = False
    TabOrder = 3
    Visible = False
    object tabServer: TTabSheet
      Caption = 'Server'
    end
    object tabProgram: TTabSheet
      Caption = 'Program'
      ImageIndex = 4
    end
    object tabLogging: TTabSheet
      Caption = 'Logging'
      ImageIndex = 5
    end
    object tabAutoRun: TTabSheet
      Caption = 'Auto Run'
      ImageIndex = 3
<<<<<<< HEAD
=======
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
>>>>>>> parent of f15a929... Added Login information to setup form.
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
        TabOrder = 0
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
        Left = 58
        Top = 25
        Width = 225
        Height = 13
        Caption = 'Use HTTP Proxy for Registration Authentication'
      end
      object Label7: TLabel
        Left = 57
        Top = 52
        Width = 67
        Height = 13
        Caption = 'Proxy Address'
      end
      object Label8: TLabel
        Left = 76
        Top = 76
        Width = 48
        Height = 13
        Caption = 'Proxy Port'
      end
      object tbProxyAddress: TEdit
        Left = 130
        Top = 44
        Width = 121
        Height = 21
        Enabled = False
        TabOrder = 0
        OnChange = tbUserChange
      end
      object tbProxyPort: TEdit
        Left = 130
        Top = 71
        Width = 57
        Height = 21
        Enabled = False
        TabOrder = 1
        Text = '8080'
        OnChange = tbUserChange
      end
      object cbUseAuthProxy: TCheckBox
        Left = 35
        Top = 23
        Width = 17
        Height = 17
        TabOrder = 2
      end
    end
  end
<<<<<<< HEAD
  object btnOK: TButton
    Left = 317
    Top = 369
=======
  object btnOKMain: TButton
    Left = 216
    Top = 352
>>>>>>> parent of f15a929... Added Login information to setup form.
    Width = 73
    Height = 25
    Caption = '&OK'
    TabOrder = 15
  end
<<<<<<< HEAD
  object btnCancel: TButton
    Left = 467
    Top = 369
=======
  object btnCancelMain: TButton
    Left = 296
    Top = 352
>>>>>>> parent of f15a929... Added Login information to setup form.
    Width = 73
    Height = 25
    Caption = '&Cancel'
    TabOrder = 17
    OnClick = btnCancelMainClick
  end
  object cbGames: TComboBox
    Left = 77
    Top = 12
    Width = 167
    Height = 21
    ItemHeight = 13
    TabOrder = 0
    OnChange = cbGamesChange
  end
  object btnAdd: TButton
    Left = 257
    Top = 10
    Width = 65
    Height = 25
    Caption = '&New'
    TabOrder = 1
    OnClick = btnAddClick
  end
  object btnDelete: TButton
    Left = 328
    Top = 10
    Width = 65
    Height = 25
    Caption = '&Delete'
    TabOrder = 2
    OnClick = btnDeleteClick
  end
  object btnAbout: TButton
    Left = 19
    Top = 369
    Width = 73
    Height = 25
    Caption = '&About'
    TabOrder = 13
  end
  object cbDefault: TCheckBox
    Left = 250
    Top = 373
    Width = 61
    Height = 17
    Caption = 'Default'
    TabOrder = 14
  end
  object btnApply: TButton
    Left = 396
    Top = 369
    Width = 65
    Height = 25
    Caption = '&Apply'
    TabOrder = 16
  end
  object OpenDialog: TOpenDialog
    Filter = 'TW script (*.ts, *.ets, *.es)|*.ts;*.ets;*.cts'
<<<<<<< HEAD
    Left = 420
    Top = 8
=======
    Left = 332
    Top = 24
>>>>>>> parent of f15a929... Added Login information to setup form.
  end
  object tmrReg: TTimer
    Enabled = False
    Interval = 10000
    OnTimer = tmrRegTimer
<<<<<<< HEAD
    Left = 448
    Top = 8
=======
    Left = 336
    Top = 56
>>>>>>> parent of f15a929... Added Login information to setup form.
  end
end
