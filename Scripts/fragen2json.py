f = open("fragen.txt", "r")
trainf = open("bb_fragen_train.json", "w")
testf = open("bb_fragen_test.json", "w")

train = [5, 7, 8, 11, 13, 14, 17, 18, 19, 20, 21, 23, 24, 25, 26, 29, 33, 34, 36]
test = [2, 3, 4, 6, 9, 10, 12, 15, 16, 22, 27, 28, 30, 31, 32, 35, 37, 38]

txt = f.read()
a = txt.split("#")

i = 1

traino = "["
testo = "["

# Loop through individual questions + respective queries
for b in a:
    if b == "":
        continue
    i += 1
    # break entry into Question + SPARQL
    c = b.split("\n", 1)
    # Substring from second space to EOL to get question
    q = c[0][(c[0].find(" ", c[0].find(" ") + 1) + 1) :]
    # remove line breaks
    sparql = c[1].replace("\n", " ")
    sparql = sparql.replace("   ", "")
    # Output in JSON format for QAnswer
    out = (
        '\n{\n\t"question": "'
        + q
        + '",\n\t"language": "en",\n\t"id": '
        + str(i)
        + ',\n\t"sparql": "'
        + sparql
        + '"\n},'
    )
    if i in train:
        traino += out
    else:
        testo += out
# remove last "," and close bracket
traino = traino[:-1] + "]"
testo = testo[:-1] + "]"

trainf.write(traino)
testf.write(testo)

trainf.close()
testf.close()

f.close()
