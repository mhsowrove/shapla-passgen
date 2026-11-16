# Third-party notices

This project is an independent implementation and is not affiliated with Passgen.co. No source code or proprietary dictionary from that service is included.

## qrcode-generator

Copyright (c) 2009 Kazuhiko Arase. MIT license; the complete notice is in `vendor/qrcode-LICENSE`.

Source: https://github.com/kazuhikoarase/qrcode-generator

Bundled upstream file: https://raw.githubusercontent.com/kazuhikoarase/qrcode-generator/master/js/dist/qrcode.js

UTF-8 byte conversion is configured by Shapla at runtime. The library draws QR codes locally and makes no network requests.

## zxcvbn

Copyright (c) 2012–2016 Dropbox, Inc. and contributors. MIT license; complete notice in `vendor/zxcvbn-LICENSE`.

Source: https://github.com/dropbox/zxcvbn

Bundled upstream file: https://raw.githubusercontent.com/dropbox/zxcvbn/master/dist/zxcvbn.js

The bundled distribution includes its pattern dictionaries. It estimates guessing difficulty; it does not certify security or establish that a password is not breached.

## EFF long word list

Electronic Frontier Foundation and Joseph Bonneau, 2016.

Source: https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt

Project page: https://www.eff.org/dice

License: Creative Commons Attribution 4.0 International under EFF’s current copyright policy, https://www.eff.org/copyright and https://creativecommons.org/licenses/by/4.0/ . Earlier distributions identify CC BY 3.0, https://creativecommons.org/licenses/by/3.0/ . Attribution is retained for both provenance records.

The 7,776 source entries are bundled in `words.js`. At runtime Shapla removes four hyphenated entries, leaving 7,772 entries, and creates a separate short-word subset. Dice lookup numbers are omitted. No endorsement is implied.

## Multilingual word-list data

Data obtained from https://github.com/ulif/diceware/tree/master/diceware/wordlists . Only dictionary data are included; no Python implementation code is used. Upstream’s complete notices are preserved in `vendor/wordlists-COPYRIGHT`.

| Lists | Author / copyright | License |
| --- | --- | --- |
| German | 2021 Uli Fouquet | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| French | 2024 Tango | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Brazilian Portuguese | 2019 drebs | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| Catalan, Spanish, Italian | 2024 victordargallo | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

Adaptations: lookup numbers removed; Unicode normalized; accents removed and ß transliterated to ss; lowercased; entries with non-ASCII letters removed; duplicates removed. The result is bundled in `wordlists.js`. No author endorsement is implied. Runtime counts and entropy use the adapted list sizes.

## Optional Pwned Passwords service

Have I Been Pwned, by Troy Hunt. The app uses only the free range API when the visitor explicitly requests it.

Documentation: https://haveibeenpwned.com/API/v3#PwnedPasswords

Data attribution: Have I Been Pwned / Pwned Passwords, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). No breach database is bundled. Only a hash prefix leaves the device; normal network metadata also reaches the service.

The original Shapla code is MIT licensed under `LICENSE`. Third-party materials retain the licenses above. Preserve all required notices when redistributing.
