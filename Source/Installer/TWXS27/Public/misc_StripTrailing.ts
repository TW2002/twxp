# Remove Trailing Spaces from value - Text/Numbers or any combo
# Passed       : $StripTrailing~Value - Multi/Single word value with trailing spaces
# Returned     : $StripTrailing~NewValue - Trailing spaces stripped
#              : $error - 1 = No value given
#              : $ErrorLine - The line of text tested
#              : --->  If the $StripTrailing~Value is '0' it will be returned
#   There may be a better way of doing this and it does nothing for leading
#   spaces but I'll leave that to the reader
#

:StripTrailing
  SetVar $error 0
  SetVar $NewValue ""
  SetVar $beol "-----------------------------BEOL-----------------------------"
  GetWord $Value $Test 1 $beol
  IF ($Test = $beol)
    SetVar $Error 1
    SetVar $ErrorLine $Value
    RETURN
  ELSE
    GetLength $Value $L_Value
    SetVar $i 1
    GetWord $Value $Word 1
    WHILE ($Word <> $beol)
      GetWord $Value $Word $i $beol
      IF ($Word <> $beol)
        SetVar $Word[$i] $Word
        ADD $i 1
      END
    END
  END
  SetVar $i ($i - 1)
  SetVar $LastWord $Word[$i]
  SetVar $Cut 1
  WHILE ($LastWord = $Word[$i])
    CutText $Value $CutText 1 $L_Value
    GetWord $CutText $LastWord $i $beol
    SetVar $L_Value ($L_Value - $Cut)
  END
  CutText $Value $NewValue 1 ($L_Value + 2)
  # Clear all variables
  # Some are not necessary but better safe than sorry!
  SetVar $Value ""
  SetVar $Test ""
  SetVar $ErrorLine ""
  SetVar $L_Value 0
  SetVar $Word ""
  SetVar $CutText ""
  SetVar $LastWord ""
  SetVar $i 0
  SetVar $Cut 0
  SetArray $Word 0
  RETURN
