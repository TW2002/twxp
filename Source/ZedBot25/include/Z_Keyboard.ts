# INCLUDE: Z_Keyboard 
#
# Gosub :Z_Keyboard~GETKEY - Returns the key pressed from a subset of all keys available. (Subset must be set before the call.) 
# Gosub :Z_Keyboard~SETKEY - Returns the key pressed from all keys available. 
#
# Currently 283 keys available. 
#
# GETKEY 
# SetVar $Z_Keyboard~numberofkeys - Set the number of available keys 
# SetVar $Z_Keyboard~keys[x] - Set each key code that the user will be able to use - 1 per SetVar up to $Z_Keyboard~numberofkeys. 
# NOTE: The code is the same as that which is returned in $Z_Keyboard~key in a $Z_Keyboard~GETAKEY call. 
# Returns $Z_Keyboard~key  (keypressed) 
# Returns $Z_Keyboard~keydisplay  (keypressed - display version) 
#
:GETKEY
Gosub :SETUPARRAY
:WAITFORKEY
SetTextOutTrigger getakey :GETAKEY ""
Pause
:GETAKEY
Killtrigger getakey
GetOutText $key
SetVar $i 1
SetVar $keyok FALSE
While $i <= $numberofkeys
	If ($key = $keys[$i])
		SetVar $i $numberofkeys
		SetVar $keyok TRUE
	End
	SetVar $i ($i + 1)
End
If ($keyok <> TRUE)
	PROCESSOUT $key
	Goto :WAITFORKEY
End
SetVar $i 1
SetVar $keyok FALSE
While $i <= $arraysize
	If ($key = $keyboard[$i][1])
		SetVar $keydisplay $keyboard[$i][2]
		SetVar $i $arraysize
		SetVar $keyok TRUE
	End
	SetVar $i ($i + 1)
End
If ($keyok <> TRUE)
	PROCESSOUT $key
	Goto :WAITFORKEY
End
SetArray $keyboard 0
SetVar $arraysize ""
Return
# SETKEY 
# Returns $Z_Keyboard~key  (keypressed) 
# Returns $Z_Keyboard~keydisplay  (keypressed - display version) 
#
:SETKEY
Gosub :SETUPARRAY
:WAITFORAKEY
SetTextOutTrigger setakey :SETAKEY ""
Pause
:SETAKEY
Killtrigger setakey
GetOutText $key
SetVar $i 1
SetVar $keyok FALSE
While $i <= $arraysize
	If ($key = $keyboard[$i][1])
		SetVar $keydisplay $keyboard[$i][2]
		SetVar $i $arraysize
		SetVar $keyok TRUE
	End
	SetVar $i ($i + 1)
End
If ($keyok <> TRUE)
	PROCESSOUT $key
	Goto :WAITFORAKEY
End
SetArray $keyboard 0
SetVar $arraysize ""
Return
# SETUPARRAY
# Internal Use Only 
:SETUPARRAY
SetVar $arraysize 283
SetArray $keyboard 283 2

# CTRL A-Z 
SetVar $keyboard[1][1] #1
SetVar $keyboard[2][1] #2
SetVar $keyboard[3][1] #3
SetVar $keyboard[4][1] #4
SetVar $keyboard[5][1] #5
SetVar $keyboard[6][1] #6
SetVar $keyboard[7][1] #7
SetVar $keyboard[8][1] #8
SetVar $keyboard[9][1] #9
SetVar $keyboard[10][1] #10
SetVar $keyboard[11][1] #11
SetVar $keyboard[12][1] #12
SetVar $keyboard[13][1] #13
SetVar $keyboard[14][1] #14
SetVar $keyboard[15][1] #15
SetVar $keyboard[16][1] #16
SetVar $keyboard[17][1] #17
SetVar $keyboard[18][1] #18
SetVar $keyboard[19][1] #19
SetVar $keyboard[20][1] #20
SetVar $keyboard[21][1] #21
SetVar $keyboard[22][1] #22
SetVar $keyboard[23][1] #23
SetVar $keyboard[24][1] #24
SetVar $keyboard[25][1] #25
SetVar $keyboard[26][1] #26

SetVar $keyboard[1][2] "CTRL A"
SetVar $keyboard[2][2] "CTRL B"
SetVar $keyboard[3][2] "CTRL C"
SetVar $keyboard[4][2] "CTRL D"
SetVar $keyboard[5][2] "CTRL E"
SetVar $keyboard[6][2] "CTRL F"
SetVar $keyboard[7][2] "CTRL G"
SetVar $keyboard[8][2] "CTRL H"
SetVar $keyboard[9][2] "CTRL I"
SetVar $keyboard[10][2] "CTRL J"
SetVar $keyboard[11][2] "CTRL K"
SetVar $keyboard[12][2] "CTRL L"
SetVar $keyboard[13][2] "CTRL M"
SetVar $keyboard[14][2] "CTRL N"
SetVar $keyboard[15][2] "CTRL O"
SetVar $keyboard[16][2] "CTRL P"
SetVar $keyboard[17][2] "CTRL Q"
SetVar $keyboard[18][2] "CTRL R"
SetVar $keyboard[19][2] "CTRL S"
SetVar $keyboard[20][2] "CTRL T"
SetVar $keyboard[21][2] "CTRL U"
SetVar $keyboard[22][2] "CTRL V"
SetVar $keyboard[23][2] "CTRL W"
SetVar $keyboard[24][2] "CTRL X"
SetVar $keyboard[25][2] "CTRL Y"
SetVar $keyboard[26][2] "CTRL Z"

# ALT A-Z 
SetVar $keyboard[27][1] #27&#97
SetVar $keyboard[28][1] #27&#98
SetVar $keyboard[29][1] #27&#99
SetVar $keyboard[30][1] #27&#100
SetVar $keyboard[31][1] #27&#101
SetVar $keyboard[32][1] #27&#102
SetVar $keyboard[33][1] #27&#103
SetVar $keyboard[34][1] #27&#104
SetVar $keyboard[35][1] #27&#105
SetVar $keyboard[36][1] #27&#106
SetVar $keyboard[37][1] #27&#107
SetVar $keyboard[38][1] #27&#108
SetVar $keyboard[39][1] #27&#109
SetVar $keyboard[40][1] #27&#110
SetVar $keyboard[41][1] #27&#111
SetVar $keyboard[42][1] #27&#112
SetVar $keyboard[43][1] #27&#113
SetVar $keyboard[44][1] #27&#114
SetVar $keyboard[45][1] #27&#115
SetVar $keyboard[46][1] #27&#116
SetVar $keyboard[47][1] #27&#117
SetVar $keyboard[48][1] #27&#118
SetVar $keyboard[49][1] #27&#119
SetVar $keyboard[50][1] #27&#120
SetVar $keyboard[51][1] #27&#121
SetVar $keyboard[52][1] #27&#122

SetVar $keyboard[27][2] "ALT A"
SetVar $keyboard[28][2] "ALT B"
SetVar $keyboard[29][2] "ALT C"
SetVar $keyboard[30][2] "ALT D"
SetVar $keyboard[31][2] "ALT E"
SetVar $keyboard[32][2] "ALT F"
SetVar $keyboard[33][2] "ALT G"
SetVar $keyboard[34][2] "ALT H"
SetVar $keyboard[35][2] "ALT I"
SetVar $keyboard[36][2] "ALT J"
SetVar $keyboard[37][2] "ALT K"
SetVar $keyboard[38][2] "ALT L"
SetVar $keyboard[39][2] "ALT M"
SetVar $keyboard[40][2] "ALT N"
SetVar $keyboard[41][2] "ALT O"
SetVar $keyboard[42][2] "ALT P"
SetVar $keyboard[43][2] "ALT Q"
SetVar $keyboard[44][2] "ALT R"
SetVar $keyboard[45][2] "ALT S"
SetVar $keyboard[46][2] "ALT T"
SetVar $keyboard[47][2] "ALT U"
SetVar $keyboard[48][2] "ALT V"
SetVar $keyboard[49][2] "ALT W"
SetVar $keyboard[50][2] "ALT X"
SetVar $keyboard[51][2] "ALT Y"
SetVar $keyboard[52][2] "ALT Z"

# SHIFTALT A-Z 
SetVar $keyboard[53][1] #27&#65
SetVar $keyboard[54][1] #27&#66
SetVar $keyboard[55][1] #27&#67
SetVar $keyboard[56][1] #27&#68
SetVar $keyboard[57][1] #27&#69
SetVar $keyboard[58][1] #27&#70
SetVar $keyboard[59][1] #27&#71
SetVar $keyboard[60][1] #27&#72
SetVar $keyboard[61][1] #27&#73
SetVar $keyboard[62][1] #27&#74
SetVar $keyboard[63][1] #27&#75
SetVar $keyboard[64][1] #27&#76
SetVar $keyboard[65][1] #27&#77
SetVar $keyboard[66][1] #27&#78
SetVar $keyboard[67][1] #27&#79
SetVar $keyboard[68][1] #27&#80
SetVar $keyboard[69][1] #27&#81
SetVar $keyboard[70][1] #27&#82
SetVar $keyboard[71][1] #27&#83
SetVar $keyboard[72][1] #27&#84
SetVar $keyboard[73][1] #27&#85
SetVar $keyboard[74][1] #27&#86
SetVar $keyboard[75][1] #27&#87
SetVar $keyboard[76][1] #27&#88
SetVar $keyboard[77][1] #27&#89
SetVar $keyboard[78][1] #27&#90

SetVar $keyboard[53][2] "SHIFTALT A"
SetVar $keyboard[54][2] "SHIFTALT B"
SetVar $keyboard[55][2] "SHIFTALT C"
SetVar $keyboard[56][2] "SHIFTALT D"
SetVar $keyboard[57][2] "SHIFTALT E"
SetVar $keyboard[58][2] "SHIFTALT F"
SetVar $keyboard[59][2] "SHIFTALT G"
SetVar $keyboard[60][2] "SHIFTALT H"
SetVar $keyboard[61][2] "SHIFTALT I"
SetVar $keyboard[62][2] "SHIFTALT J"
SetVar $keyboard[63][2] "SHIFTALT K"
SetVar $keyboard[64][2] "SHIFTALT L"
SetVar $keyboard[65][2] "SHIFTALT M"
SetVar $keyboard[66][2] "SHIFTALT N"
SetVar $keyboard[67][2] "SHIFTALT O"
SetVar $keyboard[68][2] "SHIFTALT P"
SetVar $keyboard[69][2] "SHIFTALT Q"
SetVar $keyboard[70][2] "SHIFTALT R"
SetVar $keyboard[71][2] "SHIFTALT S"
SetVar $keyboard[72][2] "SHIFTALT T"
SetVar $keyboard[73][2] "SHIFTALT U"
SetVar $keyboard[74][2] "SHIFTALT V"
SetVar $keyboard[75][2] "SHIFTALT W"
SetVar $keyboard[76][2] "SHIFTALT X"
SetVar $keyboard[77][2] "SHIFTALT Y"
SetVar $keyboard[78][2] "SHIFTALT Z"

# SHIFT A-Z 
SetVar $keyboard[79][1] #65
SetVar $keyboard[80][1] #66
SetVar $keyboard[81][1] #67
SetVar $keyboard[82][1] #68
SetVar $keyboard[83][1] #69
SetVar $keyboard[84][1] #70
SetVar $keyboard[85][1] #71
SetVar $keyboard[86][1] #72
SetVar $keyboard[87][1] #73
SetVar $keyboard[88][1] #74
SetVar $keyboard[89][1] #75
SetVar $keyboard[90][1] #76
SetVar $keyboard[91][1] #77
SetVar $keyboard[92][1] #78
SetVar $keyboard[93][1] #79
SetVar $keyboard[94][1] #80
SetVar $keyboard[95][1] #81
SetVar $keyboard[96][1] #82
SetVar $keyboard[97][1] #83
SetVar $keyboard[98][1] #84
SetVar $keyboard[99][1] #85
SetVar $keyboard[100][1] #86
SetVar $keyboard[101][1] #87
SetVar $keyboard[102][1] #88
SetVar $keyboard[103][1] #89
SetVar $keyboard[104][1] #90

SetVar $keyboard[79][2] "SHIFT A"
SetVar $keyboard[80][2] "SHIFT B"
SetVar $keyboard[81][2] "SHIFT C"
SetVar $keyboard[82][2] "SHIFT D"
SetVar $keyboard[83][2] "SHIFT E"
SetVar $keyboard[84][2] "SHIFT F"
SetVar $keyboard[85][2] "SHIFT G"
SetVar $keyboard[86][2] "SHIFT H"
SetVar $keyboard[87][2] "SHIFT I"
SetVar $keyboard[88][2] "SHIFT J"
SetVar $keyboard[89][2] "SHIFT K"
SetVar $keyboard[90][2] "SHIFT L"
SetVar $keyboard[91][2] "SHIFT M"
SetVar $keyboard[92][2] "SHIFT N"
SetVar $keyboard[93][2] "SHIFT O"
SetVar $keyboard[94][2] "SHIFT P"
SetVar $keyboard[95][2] "SHIFT Q"
SetVar $keyboard[96][2] "SHIFT R"
SetVar $keyboard[97][2] "SHIFT S"
SetVar $keyboard[98][2] "SHIFT T"
SetVar $keyboard[99][2] "SHIFT U"
SetVar $keyboard[100][2] "SHIFT V"
SetVar $keyboard[101][2] "SHIFT W"
SetVar $keyboard[102][2] "SHIFT X"
SetVar $keyboard[103][2] "SHIFT Y"
SetVar $keyboard[104][2] "SHIFT Z"

# A-Z 
SetVar $keyboard[105][1] #27&#97
SetVar $keyboard[106][1] #27&#98
SetVar $keyboard[107][1] #27&#99
SetVar $keyboard[108][1] #27&#100
SetVar $keyboard[109][1] #27&#101
SetVar $keyboard[110][1] #27&#102
SetVar $keyboard[111][1] #27&#103
SetVar $keyboard[112][1] #27&#104
SetVar $keyboard[113][1] #27&#105
SetVar $keyboard[114][1] #27&#106
SetVar $keyboard[115][1] #27&#107
SetVar $keyboard[116][1] #27&#108
SetVar $keyboard[117][1] #27&#109
SetVar $keyboard[118][1] #27&#110
SetVar $keyboard[119][1] #27&#111
SetVar $keyboard[120][1] #27&#112
SetVar $keyboard[121][1] #27&#113
SetVar $keyboard[122][1] #27&#114
SetVar $keyboard[123][1] #27&#115
SetVar $keyboard[124][1] #27&#116
SetVar $keyboard[125][1] #27&#117
SetVar $keyboard[126][1] #27&#118
SetVar $keyboard[127][1] #27&#119
SetVar $keyboard[128][1] #27&#120
SetVar $keyboard[129][1] #27&#121
SetVar $keyboard[130][1] #27&#122

SetVar $keyboard[105][2] "A"
SetVar $keyboard[106][2] "B"
SetVar $keyboard[107][2] "C"
SetVar $keyboard[108][2] "D"
SetVar $keyboard[109][2] "E"
SetVar $keyboard[110][2] "F"
SetVar $keyboard[111][2] "G"
SetVar $keyboard[112][2] "H"
SetVar $keyboard[113][2] "I"
SetVar $keyboard[114][2] "J"
SetVar $keyboard[115][2] "K"
SetVar $keyboard[116][2] "L"
SetVar $keyboard[117][2] "M"
SetVar $keyboard[118][2] "N"
SetVar $keyboard[119][2] "O"
SetVar $keyboard[120][2] "P"
SetVar $keyboard[121][2] "Q"
SetVar $keyboard[122][2] "R"
SetVar $keyboard[123][2] "S"
SetVar $keyboard[124][2] "T"
SetVar $keyboard[125][2] "U"
SetVar $keyboard[126][2] "V"
SetVar $keyboard[127][2] "W"
SetVar $keyboard[128][2] "X"
SetVar $keyboard[129][2] "Y"
SetVar $keyboard[130][2] "Z"

# F1 - F12 
SetVar $keyboard[131][1] #27&#91&#49&#49&#126
SetVar $keyboard[132][1] #27&#91&#49&#50&#126
SetVar $keyboard[133][1] #27&#91&#49&#51&#126
SetVar $keyboard[134][1] #27&#91&#49&#52&#126
SetVar $keyboard[135][1] #27&#91&#49&#53&#126
SetVar $keyboard[136][1] #27&#91&#49&#55&#126
SetVar $keyboard[137][1] #27&#91&#49&#56&#126
SetVar $keyboard[138][1] #27&#91&#49&#57&#126
SetVar $keyboard[139][1] #27&#91&#50&#48&#126
SetVar $keyboard[140][1] #27&#91&#50&#49&#126
SetVar $keyboard[141][1] #27&#91&#50&#51&#126
SetVar $keyboard[142][1] #27&#91&#50&#52&#126

SetVar $keyboard[131][2] "F1"
SetVar $keyboard[132][2] "F2"
SetVar $keyboard[133][2] "F3"
SetVar $keyboard[134][2] "F4"
SetVar $keyboard[135][2] "F5"
SetVar $keyboard[136][2] "F6"
SetVar $keyboard[137][2] "F7"
SetVar $keyboard[138][2] "F8"
SetVar $keyboard[139][2] "F9"
SetVar $keyboard[140][2] "F10"
SetVar $keyboard[141][2] "F11"
SetVar $keyboard[142][2] "F12"

# ALT F1 - F12 
SetVar $keyboard[143][1] #27&#27&#91&#49&#49&#126
SetVar $keyboard[144][1] #27&#27&#91&#49&#50&#126
SetVar $keyboard[145][1] #27&#27&#91&#49&#51&#126
SetVar $keyboard[146][1] #27&#27&#91&#49&#52&#126
SetVar $keyboard[147][1] #27&#27&#91&#49&#53&#126
SetVar $keyboard[148][1] #27&#27&#91&#49&#55&#126
SetVar $keyboard[149][1] #27&#27&#91&#49&#56&#126
SetVar $keyboard[150][1] #27&#27&#91&#49&#57&#126
SetVar $keyboard[151][1] #27&#27&#91&#50&#48&#126
SetVar $keyboard[152][1] #27&#27&#91&#50&#49&#126
SetVar $keyboard[153][1] #27&#27&#91&#50&#51&#126
SetVar $keyboard[154][1] #27&#27&#91&#50&#52&#126

SetVar $keyboard[143][2] "ALT F1"
SetVar $keyboard[144][2] "ALT F2"
SetVar $keyboard[145][2] "ALT F3"
SetVar $keyboard[146][2] "ALT F4"
SetVar $keyboard[147][2] "ALT F5"
SetVar $keyboard[148][2] "ALT F6"
SetVar $keyboard[149][2] "ALT F7"
SetVar $keyboard[150][2] "ALT F8"
SetVar $keyboard[151][2] "ALT F9"
SetVar $keyboard[152][2] "ALT F10"
SetVar $keyboard[153][2] "ALT F11"
SetVar $keyboard[154][2] "ALT F12"

# SHIFT F1 - F10 
SetVar $keyboard[155][1] #27&#91&#50&#51&#126
SetVar $keyboard[156][1] #27&#91&#50&#52&#126
SetVar $keyboard[157][1] #27&#91&#50&#53&#126
SetVar $keyboard[158][1] #27&#91&#50&#54&#126
SetVar $keyboard[159][1] #27&#91&#50&#56&#126
SetVar $keyboard[160][1] #27&#91&#50&#57&#126
SetVar $keyboard[161][1] #27&#91&#51&#49&#126
SetVar $keyboard[162][1] #27&#91&#51&#50&#126
SetVar $keyboard[163][1] #27&#91&#51&#51&#126
SetVar $keyboard[164][1] #27&#91&#51&#52&#126

SetVar $keyboard[155][2] "SHIFT F1"
SetVar $keyboard[156][2] "SHIFT F2"
SetVar $keyboard[157][2] "SHIFT F3"
SetVar $keyboard[158][2] "SHIFT F4"
SetVar $keyboard[159][2] "SHIFT F5"
SetVar $keyboard[160][2] "SHIFT F6"
SetVar $keyboard[161][2] "SHIFT F7"
SetVar $keyboard[162][2] "SHIFT F8"
SetVar $keyboard[163][2] "SHIFT F9"
SetVar $keyboard[164][2] "SHIFT F10"

# SHIFT F1 - F10 
SetVar $keyboard[165][1] #27&#27&#91&#50&#51&#126
SetVar $keyboard[166][1] #27&#27&#91&#50&#52&#126
SetVar $keyboard[167][1] #27&#27&#91&#50&#53&#126
SetVar $keyboard[168][1] #27&#27&#91&#50&#54&#126
SetVar $keyboard[169][1] #27&#27&#91&#50&#56&#126
SetVar $keyboard[170][1] #27&#27&#91&#50&#57&#126
SetVar $keyboard[171][1] #27&#27&#91&#51&#49&#126
SetVar $keyboard[172][1] #27&#27&#91&#51&#50&#126
SetVar $keyboard[173][1] #27&#27&#91&#51&#51&#126
SetVar $keyboard[174][1] #27&#27&#91&#51&#52&#126

SetVar $keyboard[165][2] "SHIFTALT F1"
SetVar $keyboard[166][2] "SHIFTALT F2"
SetVar $keyboard[167][2] "SHIFTALT F3"
SetVar $keyboard[168][2] "SHIFTALT F4"
SetVar $keyboard[169][2] "SHIFTALT F5"
SetVar $keyboard[170][2] "SHIFTALT F6"
SetVar $keyboard[171][2] "SHIFTALT F7"
SetVar $keyboard[172][2] "SHIFTALT F8"
SetVar $keyboard[173][2] "SHIFTALT F9"
SetVar $keyboard[174][2] "SHIFTALT F10"

# 1 - 0 
SetVar $keyboard[175][1] #49
SetVar $keyboard[176][1] #50
SetVar $keyboard[177][1] #51
SetVar $keyboard[178][1] #52
SetVar $keyboard[179][1] #53
SetVar $keyboard[180][1] #54
SetVar $keyboard[181][1] #55
SetVar $keyboard[182][1] #56
SetVar $keyboard[183][1] #57
SetVar $keyboard[184][1] #58

SetVar $keyboard[175][2] "1"
SetVar $keyboard[176][2] "2"
SetVar $keyboard[177][2] "3"
SetVar $keyboard[178][2] "4"
SetVar $keyboard[179][2] "5"
SetVar $keyboard[180][2] "6"
SetVar $keyboard[181][2] "7"
SetVar $keyboard[182][2] "8"
SetVar $keyboard[183][2] "9"
SetVar $keyboard[184][2] "0"

# !@#%^&*()-=_+ 
SetVar $keyboard[175][1] #33
SetVar $keyboard[176][1] #64
SetVar $keyboard[177][1] #35
SetVar $keyboard[178][1] #37
SetVar $keyboard[179][1] #94
SetVar $keyboard[180][1] #38
SetVar $keyboard[181][1] #42
SetVar $keyboard[182][1] #40
SetVar $keyboard[183][1] #41
SetVar $keyboard[184][1] #45
SetVar $keyboard[185][1] #61
SetVar $keyboard[186][1] #95
SetVar $keyboard[187][1] #43

SetVar $keyboard[175][2] "!"
SetVar $keyboard[176][2] "@"
SetVar $keyboard[177][2] "#"
SetVar $keyboard[178][2] "%"
SetVar $keyboard[179][2] "^"
SetVar $keyboard[180][2] "&"
SetVar $keyboard[181][2] "*"
SetVar $keyboard[182][2] "("
SetVar $keyboard[183][2] ")"
SetVar $keyboard[184][1] "-"
SetVar $keyboard[185][1] "="
SetVar $keyboard[186][1] "_"
SetVar $keyboard[187][1] "+"

# ALT !@#$%^&*()-=_+ 
SetVar $keyboard[188][1] #27&#33
SetVar $keyboard[189][1] #27&#64
SetVar $keyboard[190][1] #27&#35
SetVar $keyboard[191][1] #27&#36
SetVar $keyboard[192][1] #27&#37
SetVar $keyboard[193][1] #27&#94
SetVar $keyboard[194][1] #27&#38
SetVar $keyboard[195][1] #27&#42
SetVar $keyboard[196][1] #27&#40
SetVar $keyboard[197][1] #27&#41
SetVar $keyboard[198][1] #27&#45
SetVar $keyboard[199][1] #27&#61
SetVar $keyboard[200][1] #27&#95
SetVar $keyboard[201][1] #27&#43

SetVar $keyboard[188][2] "ALT !"
SetVar $keyboard[189][2] "ALT @"
SetVar $keyboard[190][2] "ALT #"
SetVar $keyboard[191][2] "ALT $"
SetVar $keyboard[192][2] "ALT %"
SetVar $keyboard[193][2] "ALT ^"
SetVar $keyboard[194][2] "ALT &"
SetVar $keyboard[195][2] "ALT *"
SetVar $keyboard[196][2] "ALT ("
SetVar $keyboard[197][2] "ALT )"
SetVar $keyboard[198][1] "ALT -"
SetVar $keyboard[199][1] "ALT ="
SetVar $keyboard[200][1] "ALT _"
SetVar $keyboard[201][1] "ALT +"

# []{};'\:"|,./<>?`~ 
SetVar $keyboard[202][1] #91
SetVar $keyboard[203][1] #93
SetVar $keyboard[204][1] #123
SetVar $keyboard[205][1] #125
SetVar $keyboard[206][1] #59
SetVar $keyboard[207][1] #39
SetVar $keyboard[208][1] #92
SetVar $keyboard[209][1] #58
SetVar $keyboard[210][1] #34
SetVar $keyboard[211][1] #124
SetVar $keyboard[212][1] #44
SetVar $keyboard[213][1] #46
SetVar $keyboard[214][1] #47
SetVar $keyboard[215][1] #60
SetVar $keyboard[216][1] #62
SetVar $keyboard[217][1] #63
SetVar $keyboard[218][1] #96
SetVar $keyboard[219][1] #126

SetVar $keyboard[202][1] "["
SetVar $keyboard[203][1] "]"
SetVar $keyboard[204][1] "{"
SetVar $keyboard[205][1] "}"
SetVar $keyboard[206][1] ";"
SetVar $keyboard[207][1] "'"
SetVar $keyboard[208][1] "\"
SetVar $keyboard[209][1] ":"
SetVar $keyboard[210][1] #34
SetVar $keyboard[211][1] "|"
SetVar $keyboard[212][1] ","
SetVar $keyboard[213][1] "."
SetVar $keyboard[214][1] "/"
SetVar $keyboard[215][1] "<"
SetVar $keyboard[216][1] ">"
SetVar $keyboard[217][1] "?"
SetVar $keyboard[218][1] "`"
SetVar $keyboard[219][1] "~"

# TAB BACKSPACE SPACE ENTER INS DEL HOME END PGUP PGDN 
SetVar $keyboard[220][1] #9
SetVar $keyboard[221][1] #8
SetVar $keyboard[222][1] #32
SetVar $keyboard[223][1] #13
SetVar $keyboard[224][1] #27&#91&#50&#126
SetVar $keyboard[225][1] #27&#91&#51&#126
SetVar $keyboard[226][1] #27&#91&#49&#126
SetVar $keyboard[227][1] #27&#91&#52&#126
SetVar $keyboard[228][1] #27&#91&#53&#126
SetVar $keyboard[229][1] #27&#91&#54&#126

SetVar $keyboard[220][1] "TAB"
SetVar $keyboard[221][1] "BS"
SetVar $keyboard[222][1] "SPC"
SetVar $keyboard[223][1] "ENTER"
SetVar $keyboard[224][1] "INS"
SetVar $keyboard[225][1] "DEL"
SetVar $keyboard[226][1] "HOME"
SetVar $keyboard[227][1] "END"
SetVar $keyboard[228][1] "PGUP"
SetVar $keyboard[229][1] "PGDN"

# NUM /*-+ ENTER 0123456789.
SetVar $keyboard[230][1] #27&#79&#81
SetVar $keyboard[231][1] #27&#79&#82
SetVar $keyboard[232][1] #27&#79&#83
SetVar $keyboard[233][1] #27&#79&#79
SetVar $keyboard[234][1] #27&#79&#108
SetVar $keyboard[235][1] #27&#79&#112
SetVar $keyboard[236][1] #27&#79&#113
SetVar $keyboard[237][1] #27&#79&#114
SetVar $keyboard[238][1] #27&#79&#115
SetVar $keyboard[239][1] #27&#79&#116
SetVar $keyboard[240][1] #27&#79&#117
SetVar $keyboard[241][1] #27&#79&#118
SetVar $keyboard[242][1] #27&#79&#119
SetVar $keyboard[243][1] #27&#79&#120
SetVar $keyboard[244][1] #27&#79&#121
SetVar $keyboard[245][1] #27&#79&#110

SetVar $keyboard[230][1] "NUM /"
SetVar $keyboard[231][1] "NUM *"
SetVar $keyboard[232][1] "NUM -"
SetVar $keyboard[233][1] "NUM +"
SetVar $keyboard[234][1] "NUM ENTER"
SetVar $keyboard[235][1] "NUM 0"
SetVar $keyboard[236][1] "NUM 1"
SetVar $keyboard[237][1] "NUM 2"
SetVar $keyboard[238][1] "NUM 3"
SetVar $keyboard[239][1] "NUM 4"
SetVar $keyboard[240][1] "NUM 5"
SetVar $keyboard[241][1] "NUM 6"
SetVar $keyboard[242][1] "NUM 7"
SetVar $keyboard[243][1] "NUM 8"
SetVar $keyboard[244][1] "NUM 9"
SetVar $keyboard[245][1] "NUM ."

# UP DOWN RIGHT LEFT ARROWS 
SetVar $keyboard[246][1] #27&#79&#65
SetVar $keyboard[247][1] #27&#79&#66
SetVar $keyboard[248][1] #27&#79&#67
SetVar $keyboard[249][1] #27&#79&#68

SetVar $keyboard[246][1] "UP"
SetVar $keyboard[247][1] "DOWN"
SetVar $keyboard[248][1] "RIGHT"
SetVar $keyboard[249][1] "LEFT"

# ALT []{};'\:"|,./<>?`~ 
SetVar $keyboard[250][1] #27&#91
SetVar $keyboard[251][1] #27&#93
SetVar $keyboard[252][1] #27&#123
SetVar $keyboard[253][1] #27&#125
SetVar $keyboard[254][1] #27&#59
SetVar $keyboard[255][1] #27&#39
SetVar $keyboard[256][1] #27&#92
SetVar $keyboard[257][1] #27&#58
SetVar $keyboard[258][1] #27&#34
SetVar $keyboard[259][1] #27&#124
SetVar $keyboard[260][1] #27&#44
SetVar $keyboard[261][1] #27&#46
SetVar $keyboard[262][1] #27&#47
SetVar $keyboard[263][1] #27&#60
SetVar $keyboard[264][1] #27&#62
SetVar $keyboard[265][1] #27&#63
SetVar $keyboard[266][1] #27&#96
SetVar $keyboard[267][1] #27&#126

SetVar $keyboard[250][1] "ALT ["
SetVar $keyboard[251][1] "ALT ]"
SetVar $keyboard[252][1] "ALT {"
SetVar $keyboard[253][1] "ALT }"
SetVar $keyboard[254][1] "ALT ;"
SetVar $keyboard[255][1] "ALT '"
SetVar $keyboard[256][1] "ALT \"
SetVar $keyboard[257][1] "ALT :"
SetVar $keyboard[258][1] "ALT " & #34
SetVar $keyboard[259][1] "ALT |"
SetVar $keyboard[260][1] "ALT ,"
SetVar $keyboard[261][1] "ALT ."
SetVar $keyboard[262][1] "ALT /"
SetVar $keyboard[263][1] "ALT <"
SetVar $keyboard[264][1] "ALT >"
SetVar $keyboard[265][1] "ALT ?"
SetVar $keyboard[266][1] "ALT `"
SetVar $keyboard[267][1] "ALT ~"

# ALT BACKSPACE SPACE ENTER INS DEL HOME END PGUP PGDN 
SetVar $keyboard[268][1] #27&#8
SetVar $keyboard[269][1] #27&#32
SetVar $keyboard[270][1] #27&#13
SetVar $keyboard[271][1] #27&#27&#91&#50&#126
SetVar $keyboard[272][1] #27&#27&#91&#51&#126
SetVar $keyboard[273][1] #27&#27&#91&#49&#126
SetVar $keyboard[274][1] #27&#27&#91&#52&#126
SetVar $keyboard[275][1] #27&#27&#91&#53&#126
SetVar $keyboard[276][1] #27&#27&#91&#54&#126

SetVar $keyboard[268][1] "ALT BS"
SetVar $keyboard[269][1] "ALT SPC"
SetVar $keyboard[270][1] "ALT ENTER"
SetVar $keyboard[271][1] "ALT INS"
SetVar $keyboard[272][1] "ALT DEL"
SetVar $keyboard[273][1] "ALT HOME"
SetVar $keyboard[274][1] "ALT END"
SetVar $keyboard[275][1] "ALT PGUP"
SetVar $keyboard[276][1] "ALT PGDN"

# ALT UP DOWN RIGHT LEFT ARROWS 
SetVar $keyboard[277][1] #27&#27&#79&#65
SetVar $keyboard[278][1] #27&#27&#79&#66
SetVar $keyboard[279][1] #27&#27&#79&#67
SetVar $keyboard[280][1] #27&#27&#79&#68

SetVar $keyboard[277][1] "ALT UP"
SetVar $keyboard[278][1] "ALT DOWN"
SetVar $keyboard[279][1] "ALT RIGHT"
SetVar $keyboard[280][1] "ALT LEFT"

# SHIFT TAB SHIFT BACKSPACE SHIFT INS 
SetVar $keyboard[281][1] #27&#91&#90
SetVar $keyboard[282][1] #127
SetVar $keyboard[283][1] #83&#72&#73&#70&#84

SetVar $keyboard[281][2] "SHIFT TAB"
SetVar $keyboard[282][2] "SHIFT BS"
SetVar $keyboard[283][2] "SHIFT INS"
Return
