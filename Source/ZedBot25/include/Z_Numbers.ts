# NUMBERS Include Library.

# Gosub :Z_Numbers~ROUND 

# ROUND 
#
# SetVar $Z_Numbers~number  to the floating point number. \
#
# Gosub :Z_Numbers~ROUND 
#
# Returns $Z_Numbers~int as an integer. 
# Returns $Z_Numbers~mod as the mod. 
# Returns $Z_Numbers~round as the rounded number. (<5 >=5)
# Returns $Z_Numbers~roundup as the rounded UP number. 
:ROUND
ReplaceText $number "." " "
GetWord $number $int 1
GetWord $number $mod 2
IsNumber $isnum1 $int
IsNumber $isnum2 $mod
If ($isnum1 = TRUE) and ($isnum2 = TRUE)
	If ($mod <> 0)
		SetVar $roundup ($int + 1)
		If ($mod >= 5)
			SetVar $round ($int + 1)
		Else
			SetVar $round $int
		End
	End
End
Return
