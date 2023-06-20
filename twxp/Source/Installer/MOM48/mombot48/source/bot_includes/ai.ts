:escape

	#decision tree
	stuck in sector, so should:
	A. if saveme is enabled, call saveme
	B. if saveme not enabled, or not available:
		1. check quikstats (check for twarp, fedsafe, fighter amount, fuel_holds, holo, density scanner)
		2. check sector - look for ships, planets, ports
		3. check next door - look for ships, planets, ports
			a. if fedsafe and not in fed space
					1. if has twarp
					 	a. with fuel to get to fedspace
							1. twarp to fedsafe sector (probably stardock - second choice terra)
								a. scrub if possible
						b. not enough fuel (but has enough empty holds)
							1. if port sells fuel, buy fuel - goto B.3.a.1 (twarp fedsafe)
							2. if port doesn't sell fuel, check next door
								a. if safe port next door, buy fuel next door - goto B.3.a.1 (twarp fedsafe)
								b. if no safe port next door, attempt twarp to closest safe fuel port, buy fuel - goto B.3.a.1 (twarp fedsafe)
								c. if no safe port, call saveme again DONE
						c. not enough fuel (even if holds were full) - goto B.3.b.1 (twarp not fedsafe)
					2. no twarp 
						a. if port, hide in port
						b. if no port, call saveme again DONE

				b. if not fedsafe 
					1. if has twarp
					 	a. with fuel
							1. twarp to safesector
								a. if safesector not defined 
									1. attempt twarp to rylos and/or alpha
										a. scrub if possible
										b. twarp to home 
											1. if not defined, go to random deadend with friendly fighter and limpet
											2. if not available, hide in port
						b. not enough fuel (but has enough empty holds)
							1. if port sells fuel, buy fuel - goto B.3.b.1 (twarp not fedsafe)
							2. if port doesn't sell fuel, check next door
								a. if safe port next door, buy fuel next door - goto B.3.b.1 (twarp not fedsafe)
								b. if no safe port next door, attempt twarp to closest safe fuel port, buy fuel - goto B.3.b.1 (twarp not fedsafe)
								c. if no safe port, call saveme again
						c. not enough fuel (even if holds were full)
							1. if port, hide in port
							2. if no port, call saveme again DONE
					2. no twarp
						a. if port, hide in port
						b. if no port, call saveme again DONE


return