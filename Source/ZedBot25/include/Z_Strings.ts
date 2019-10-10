# INCLUDE: Z_Strings 
#
# Gosub :Z_Strings~PAD 
# Gosub :Z_Strings~LINE 
# Gosub :Z_Strings~COMMA 
# Gosub :Z_Strings~RTRIM 
# Gosub :Z_Strings~LTRIM 
# Gosub :Z_Strings~CENTRE 
#
# PAD 
# SetVar $Z_Strings~padchar to the padding character (optional - default "0") 
# SetVar $Z_Strings~padlen to the length to pad to 
# SetVar $Z_Strings~unpadded to the string to pad 
# SetVar $Z_Strings~unpadlen to the length of string to pad. (Optional - Default uses GetLength) 
# SetVar $Z_Strings~rpad to TRUE to right-pad the string 
# Returns $Z_Strings~padded 

# 
:PAD
If ($padchar = "")
	SetVar $padchar "0"
End
If ($padlen <> "0") and ($padlen <> "")
	If ($unpadlen = 0) or ($unpadlen = "")
		GetLength $unpadded $unpadlen
	End
	SetVar $pads ($padlen - $unpadlen)
	SetVar $padcount 1
	SetVar $padded $unpadded
	If ($rpad = TRUE)
		While ($padcount <= $pads)
			SetVar $padded ($padded & $padchar)
			SetVar $padcount ($padcount + 1)
		End
	Else
		While ($padcount <= $pads)
			SetVar $padded ($padchar & $padded)
			SetVar $padcount ($padcount + 1)
		End
	End
Else
	SetVar $padded ""
End
SetVar $unpadded ""
SetVar $unpadlen ""
SetVar $padcount ""
SetVar $rpad ""
Return
# LINE 
# SetVar $Z_Strings~linelen (optional -- default = 79) 
# SetVar $Z_Strings~linechar (optional -- default = #196 
# SetVar $Z_Strings~linecolour (optional -- default = ANSI_12 
# Returns $Z_Strings~line 
:LINE
If ($linelen = 0)
	SetVar $linelen 79
End
If ($linechar = 0)
	SetVar $linechar #196
End
If ($linecolour = 0)
	SetVar $linecolour ANSI_12
End
SetVar $i 1
SetVar $line $linecolour
While ($i <= $linelen)
	SetVar $line ($line & $linechar)
	SetVar $i ($i + 1)
End
Return
# COMMA 
# SetVar $Z_Strings~number 
# Returns $Z_Strings~commas 
#
:COMMA
GetLength $number $numlen
SetVar $i $numlen
SetVar $j 0
SetVar $commas ""
While ($i > 0)
	CutText $number $digit $i 1
	SetVar $commas ($digit & $commas)
	SetVar $j ($j + 1)
	If ($j = 3) and ($i > 1)
		SetVar $j 0
		SetVar $commas ("," & $commas)
	End
	SetVar $i ($i - 1)
End
SetVar $number ""
Return
# RTRIM 
# SetVar $Z_Strings~trimstring to the text to be trimmed 
# Returns $Z_Strings~trimstring 
#
:RTRIM
SetVar $trimstring ($trimstring & "@@@")
StripText $trimstring "                                                                     @@@"
StripText $trimstring "                                                                    @@@"
StripText $trimstring "                                                                   @@@"
StripText $trimstring "                                                                  @@@"
StripText $trimstring "                                                                 @@@"
StripText $trimstring "                                                                @@@"
StripText $trimstring "                                                               @@@"
StripText $trimstring "                                                              @@@"
StripText $trimstring "                                                             @@@"
StripText $trimstring "                                                            @@@"
StripText $trimstring "                                                           @@@"
StripText $trimstring "                                                          @@@"
StripText $trimstring "                                                         @@@"
StripText $trimstring "                                                        @@@"
StripText $trimstring "                                                       @@@"
StripText $trimstring "                                                      @@@"
StripText $trimstring "                                                     @@@"
StripText $trimstring "                                                    @@@"
StripText $trimstring "                                                   @@@"
StripText $trimstring "                                                  @@@"
StripText $trimstring "                                                 @@@"
StripText $trimstring "                                                @@@"
StripText $trimstring "                                               @@@"
StripText $trimstring "                                              @@@"
StripText $trimstring "                                             @@@"
StripText $trimstring "                                            @@@"
StripText $trimstring "                                           @@@"
StripText $trimstring "                                          @@@"
StripText $trimstring "                                         @@@"
StripText $trimstring "                                        @@@"
StripText $trimstring "                                       @@@"
StripText $trimstring "                                      @@@"
StripText $trimstring "                                     @@@"
StripText $trimstring "                                    @@@"
StripText $trimstring "                                   @@@"
StripText $trimstring "                                  @@@"
StripText $trimstring "                                 @@@"
StripText $trimstring "                                @@@"
StripText $trimstring "                               @@@"
StripText $trimstring "                              @@@"
StripText $trimstring "                             @@@"
StripText $trimstring "                            @@@"
StripText $trimstring "                           @@@"
StripText $trimstring "                          @@@"
StripText $trimstring "                         @@@"
StripText $trimstring "                        @@@"
StripText $trimstring "                       @@@"
StripText $trimstring "                      @@@"
StripText $trimstring "                     @@@"
StripText $trimstring "                    @@@"
StripText $trimstring "                   @@@"
StripText $trimstring "                  @@@"
StripText $trimstring "                 @@@"
StripText $trimstring "                @@@"
StripText $trimstring "               @@@"
StripText $trimstring "              @@@"
StripText $trimstring "             @@@"
StripText $trimstring "            @@@"
StripText $trimstring "           @@@"
StripText $trimstring "          @@@"
StripText $trimstring "         @@@"
StripText $trimstring "        @@@"
StripText $trimstring "       @@@"
StripText $trimstring "      @@@"
StripText $trimstring "     @@@"
StripText $trimstring "    @@@"
StripText $trimstring "   @@@"
StripText $trimstring "  @@@"
StripText $trimstring " @@@"
StripText $trimstring "@@@"
Return
# LTRIM 
# SetVar $Z_Strings~trimstring to the text to be trimmed 
# Returns $Z_Strings~trimstring 
#
:LTRIM
SetVar $trimstring ("@@@" & $trimstring)
StripText $trimstring "@@@                                                                     "
StripText $trimstring "@@@                                                                    "
StripText $trimstring "@@@                                                                   "
StripText $trimstring "@@@                                                                  "
StripText $trimstring "@@@                                                                 "
StripText $trimstring "@@@                                                                "
StripText $trimstring "@@@                                                               "
StripText $trimstring "@@@                                                              "
StripText $trimstring "@@@                                                             "
StripText $trimstring "@@@                                                            "
StripText $trimstring "@@@                                                           "
StripText $trimstring "@@@                                                          "
StripText $trimstring "@@@                                                         "
StripText $trimstring "@@@                                                        "
StripText $trimstring "@@@                                                       "
StripText $trimstring "@@@                                                      "
StripText $trimstring "@@@                                                     "
StripText $trimstring "@@@                                                    "
StripText $trimstring "@@@                                                   "
StripText $trimstring "@@@                                                  "
StripText $trimstring "@@@                                                 "
StripText $trimstring "@@@                                                "
StripText $trimstring "@@@                                               "
StripText $trimstring "@@@                                              "
StripText $trimstring "@@@                                             "
StripText $trimstring "@@@                                            "
StripText $trimstring "@@@                                           "
StripText $trimstring "@@@                                          "
StripText $trimstring "@@@                                         "
StripText $trimstring "@@@                                        "
StripText $trimstring "@@@                                       "
StripText $trimstring "@@@                                      "
StripText $trimstring "@@@                                     "
StripText $trimstring "@@@                                    "
StripText $trimstring "@@@                                   "
StripText $trimstring "@@@                                  "
StripText $trimstring "@@@                                 "
StripText $trimstring "@@@                                "
StripText $trimstring "@@@                               "
StripText $trimstring "@@@                              "
StripText $trimstring "@@@                             "
StripText $trimstring "@@@                            "
StripText $trimstring "@@@                           "
StripText $trimstring "@@@                          "
StripText $trimstring "@@@                         "
StripText $trimstring "@@@                        "
StripText $trimstring "@@@                       "
StripText $trimstring "@@@                      "
StripText $trimstring "@@@                     "
StripText $trimstring "@@@                    "
StripText $trimstring "@@@                   "
StripText $trimstring "@@@                  "
StripText $trimstring "@@@                 "
StripText $trimstring "@@@                "
StripText $trimstring "@@@               "
StripText $trimstring "@@@              "
StripText $trimstring "@@@             "
StripText $trimstring "@@@            "
StripText $trimstring "@@@           "
StripText $trimstring "@@@          "
StripText $trimstring "@@@         "
StripText $trimstring "@@@        "
StripText $trimstring "@@@       "
StripText $trimstring "@@@      "
StripText $trimstring "@@@     "
StripText $trimstring "@@@    "
StripText $trimstring "@@@   "
StripText $trimstring "@@@  "
StripText $trimstring "@@@ "
StripText $trimstring "@@@"
Return
# CENTRE 
# SetVar $Z_Strings~string to the text. 
# setVar $Z_Strings~width to the space to centre the text in. (default 68) 
# RETURNS $Z_Strings~centre 
:CENTRE
If ($width = "0")
	SetVar $width 68
End
SetVar $centre $string
GetLength $string $len 
If ($width > $len)
	SetVar $temp ($width - $len)
	SetPrecision 1
	SetVar $whitespace ($temp / 2)
	SetPrecision 0
	ReplaceText $whitespace "." " "
	GetWord $whitespace $spaces 1
	GetWord $whitespace $mod 2
	If ($mod <> "0")
		SetVar $spaces ($spaces + 1)
	End
	SetVar $x 1
	SetVar $temp ""
	While ($x <= $spaces)
		SetVar $temp ($temp & " ")
		SetVar $x ($x + 1)
	End
	SetVar $centre ($temp & $string)
End
SetVar $temp ""
SetVar $string ""
SetVar $width "0"
Return
#EndScript
