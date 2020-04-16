# ===========================  START SWATH DISABLING SUBROUTINE  =================
:swathoff
	if ($swathoff = FALSE)
		setTextTrigger swathison :swathison "Command [TL="
		setDelayTrigger swathisoff :swathisoff 2000
		pause

		:swathison
		killtrigger swathisoff
		killtrigger swathison
		setVar $swathOffMessage "Detected SWATH Autohaggle"
		setVar $swathoff FALSE
		return

		:swathisoff
		killtrigger swathisoff
		killtrigger swathison
		setVar $swathoff TRUE
	end
return
# ==========================   END SWATH DISABLING SUBROUTINE  =================
