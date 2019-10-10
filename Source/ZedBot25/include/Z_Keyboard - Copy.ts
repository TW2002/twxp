# INCLUDE: Z_Keyboard 
#
# Gosub :Z_Keyboard~KEYS 
#
# KEYS 
# Returns $Z_Keyboard~key  (keypressed) 
# Returns $Z_Keyboard~keydisplay  (keypressed - display version) 
:KEYS
Gosub :SETUPARRAY
:WAITFORKEY
SetTextOutTrigger getakey :GETAKEY ""
Pause
:GETAKEY
# Killtrigger getakey
GetOutText $key
GetLength $key $keylength
SetVar $keycodes ""
SetVar $i 1
While ($i <= $keylength)
   CutText $key $char $i 1
   GetCharCode $char $code
   SetVar $keycodes $keycodes & "#" & $code
   SetVar $i ($i +1)
end
SetVar $i 1
SetVar $keyok FALSE
While $i <= $arraysize
	If ($keycodes = $keyboard[$i][1])
		SetVar $keydisplay $keyboard[$i][2]
		SetVar $i $arraysize
		SetVar $keyok TRUE
	End
	SetVar $i ($i + 1)
End
If ($keyok <> TRUE)
	Goto :WAITFORKEY
End

#SetArray $keyboard 0 0
#SetVar $keycodes ""
#SetVar $arraysize ""
#SetVar $keylength ""
#SetVar $char ""
#SetVar $code ""
Return
:SETUPARRAY
SetVar $arraysize 104
SetArray $keyboard 256 2
# CTRL A-Z 
SetVar $keyboard[1][1] "#1"
SetVar $keyboard[2][1] "#2"
SetVar $keyboard[3][1] "#3"
SetVar $keyboard[4][1] "#4"
SetVar $keyboard[5][1] "#5"
SetVar $keyboard[6][1] "#6"
SetVar $keyboard[7][1] "#7"
SetVar $keyboard[8][1] "#8"
SetVar $keyboard[9][1] "#9"
SetVar $keyboard[10][1] "#10"
SetVar $keyboard[11][1] "#11"
SetVar $keyboard[12][1] "#12"
SetVar $keyboard[13][1] "#13"
SetVar $keyboard[14][1] "#14"
SetVar $keyboard[15][1] "#15"
SetVar $keyboard[16][1] "#16"
SetVar $keyboard[17][1] "#17"
SetVar $keyboard[18][1] "#18"
SetVar $keyboard[19][1] "#19"
SetVar $keyboard[20][1] "#20"
SetVar $keyboard[21][1] "#21"
SetVar $keyboard[22][1] "#22"
SetVar $keyboard[23][1] "#23"
SetVar $keyboard[24][1] "#24"
SetVar $keyboard[25][1] "#25"
SetVar $keyboard[26][1] "#26"

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
SetVar $keyboard[27][1] "#27#97"
SetVar $keyboard[28][1] "#27#98"
SetVar $keyboard[29][1] "#27#99"
SetVar $keyboard[30][1] "#27#100"
SetVar $keyboard[31][1] "#27#101"
SetVar $keyboard[32][1] "#27#102"
SetVar $keyboard[33][1] "#27#103"
SetVar $keyboard[34][1] "#27#104"
SetVar $keyboard[35][1] "#27#105"
SetVar $keyboard[36][1] "#27#106"
SetVar $keyboard[37][1] "#27#107"
SetVar $keyboard[38][1] "#27#108"
SetVar $keyboard[39][1] "#27#109"
SetVar $keyboard[40][1] "#27#110"
SetVar $keyboard[41][1] "#27#111"
SetVar $keyboard[42][1] "#27#112"
SetVar $keyboard[43][1] "#27#113"
SetVar $keyboard[44][1] "#27#114"
SetVar $keyboard[45][1] "#27#115"
SetVar $keyboard[46][1] "#27#116"
SetVar $keyboard[47][1] "#27#117"
SetVar $keyboard[48][1] "#27#118"
SetVar $keyboard[49][1] "#27#119"
SetVar $keyboard[50][1] "#27#120"
SetVar $keyboard[51][1] "#27#121"
SetVar $keyboard[52][1] "#27#122"

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

# ALT SHIFT A-Z 
SetVar $keyboard[53][1] "#27#65"
SetVar $keyboard[54][1] "#27#66"
SetVar $keyboard[55][1] "#27#67"
SetVar $keyboard[56][1] "#27#68"
SetVar $keyboard[57][1] "#27#69"
SetVar $keyboard[58][1] "#27#70"
SetVar $keyboard[59][1] "#27#71"
SetVar $keyboard[60][1] "#27#72"
SetVar $keyboard[61][1] "#27#73"
SetVar $keyboard[62][1] "#27#74"
SetVar $keyboard[63][1] "#27#75"
SetVar $keyboard[64][1] "#27#76"
SetVar $keyboard[65][1] "#27#77"
SetVar $keyboard[66][1] "#27#78"
SetVar $keyboard[67][1] "#27#79"
SetVar $keyboard[68][1] "#27#80"
SetVar $keyboard[69][1] "#27#81"
SetVar $keyboard[70][1] "#27#82"
SetVar $keyboard[71][1] "#27#83"
SetVar $keyboard[72][1] "#27#84"
SetVar $keyboard[73][1] "#27#85"
SetVar $keyboard[74][1] "#27#86"
SetVar $keyboard[75][1] "#27#87"
SetVar $keyboard[76][1] "#27#88"
SetVar $keyboard[77][1] "#27#89"
SetVar $keyboard[78][1] "#27#90"

SetVar $keyboard[53][2] "ALT A"
SetVar $keyboard[54][2] "ALT B"
SetVar $keyboard[55][2] "ALT C"
SetVar $keyboard[56][2] "ALT D"
SetVar $keyboard[57][2] "ALT E"
SetVar $keyboard[58][2] "ALT F"
SetVar $keyboard[59][2] "ALT G"
SetVar $keyboard[60][2] "ALT H"
SetVar $keyboard[61][2] "ALT I"
SetVar $keyboard[62][2] "ALT J"
SetVar $keyboard[63][2] "ALT K"
SetVar $keyboard[64][2] "ALT L"
SetVar $keyboard[65][2] "ALT M"
SetVar $keyboard[66][2] "ALT N"
SetVar $keyboard[67][2] "ALT O"
SetVar $keyboard[68][2] "ALT P"
SetVar $keyboard[69][2] "ALT Q"
SetVar $keyboard[70][2] "ALT R"
SetVar $keyboard[71][2] "ALT S"
SetVar $keyboard[72][2] "ALT T"
SetVar $keyboard[73][2] "ALT U"
SetVar $keyboard[74][2] "ALT V"
SetVar $keyboard[75][2] "ALT W"
SetVar $keyboard[76][2] "ALT X"
SetVar $keyboard[77][2] "ALT Y"
SetVar $keyboard[78][2] "ALT Z"

# SHIFT A-Z 
SetVar $keyboard[79][1] "#65"
SetVar $keyboard[80][1] "#66"
SetVar $keyboard[81][1] "#67"
SetVar $keyboard[82][1] "#68"
SetVar $keyboard[83][1] "#69"
SetVar $keyboard[84][1] "#70"
SetVar $keyboard[85][1] "#71"
SetVar $keyboard[86][1] "#72"
SetVar $keyboard[87][1] "#73"
SetVar $keyboard[88][1] "#74"
SetVar $keyboard[89][1] "#75"
SetVar $keyboard[90][1] "#76"
SetVar $keyboard[91][1] "#77"
SetVar $keyboard[92][1] "#78"
SetVar $keyboard[93][1] "#79"
SetVar $keyboard[94][1] "#80"
SetVar $keyboard[95][1] "#81"
SetVar $keyboard[96][1] "#82"
SetVar $keyboard[97][1] "#83"
SetVar $keyboard[98][1] "#84"
SetVar $keyboard[99][1] "#85"
SetVar $keyboard[100][1] "#86"
SetVar $keyboard[101][1] "#87"
SetVar $keyboard[102][1] "#88"
SetVar $keyboard[103][1] "#89"
SetVar $keyboard[104][1] "#90"

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





Return
