:globalPromptCheck
setVar $promptCheck 0
cutText CURRENTLINE $prompt 1 7
if ($prompt = "Command") OR ($prompt = "Citadel") OR ($prompt = "Compute") OR ($prompt = "Corpora") OR ($prompt = "<StarDo") OR ($prompt = "Planet ") OR ($prompt = "Engage ") OR ($prompt = "Option?") OR ($prompt = "<Tavern")
	setVar $promptCheck 1
end
return