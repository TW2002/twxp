
GetInput $file " What FILE to READ ?"
:filecheck
FileExists $exists $file
IF ($exists = TRUE)
Read $file $wordline $mit
Echo ANSI_11 $wordline &"*"
ELSE
Echo ANSI_14 "* FILE : "& $file &" Does Not Exist!*"
Halt
END
IF ($wordline = EOF)
GoTo :two
END
Add $mit 1
GoTo :filecheck
:two
Echo "**" ANSI_3 "                      --" ANSI_11 "===| " ANSI_14 "All Done" ANSI_11 " |===" ANSI_3 "--**"
Sound "ding.wav"
Halt
