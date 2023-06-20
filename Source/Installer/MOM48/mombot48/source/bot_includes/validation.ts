#Author: The Bounty Hunter
#Allows a scripter to lock a compiled version of a script to a certain game or time.


# ============================== SCRIPT VALIDATION ==============================
:validation
	GetTime $CurrentDate "d:m:yyyy"
	GetWordPos $CurrentDate $SemiPos ":"
	CutText $CurrentDate $Day 1 ($SemiPos - 1)
	CutText $CurrentDate $CurrentDate ($SemiPos +1) 999
	GetWordPos $CurrentDate $SemiPos ":"
	CutText $CurrentDate $Month 1 ($SemiPos - 1)
	CutText $CurrentDate $Year ($SemiPos +1) 999
	Setvar $OkayToUse TRUE
#Just uncomment and adjust the if statements to lock the script in whatever way you want

#	if ($Month <> 2)
#		Setvar $OkayToUse FALSE
#	end
#	if ($Year <> 2006)
#		Setvar $OkayToUse FALSE
#	end
#	if ($Day > 22)
#		Setvar $OkayToUse FALSE
#	end
#	if (STARDOCK <> 1222)
#		Setvar $OkayToUse FALSE
#	end
#	if (SECTORS <> 5000)
#		Setvar $OkayToUse FALSE
#	end

	if ($OkayToUse = FALSE)
		echo "***"
		echo ansi13 "This script Version is no longer valid, contact A Mind ()ver Matter member for an extension.*"
		echo ansi14 "This script Version is no longer valid, contact A Mind ()ver Matter member for an extension.*"
		echo ansi15 "This script Version is no longer valid, contact A Mind ()ver Matter member for an extension.*"
		echo ansi16 "This script Version is no longer valid, contact A Mind ()ver Matter member for an extension.*"
		echo "***"
			halt
	end
return
# ============================== END SCRIPT VALIDATION SUB==============================