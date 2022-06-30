import re

def prefixToURI(sparql):
    ret = re.sub(r"meta:([a-zA-Z]+)", r"<http://snik.eu/ontology/meta/\1>", sparql) # replace meta prefix
    ret = re.sub(r"bb:([a-zA-Z]+)", r"<http://snik.eu/ontology/bb/\1>", ret) # replace bb prefix
    ret = re.sub(r"rdfs:([a-zA-Z]+)", r"<http://www.w3.org/2000/01/rdf-schema#\1>", ret) # replace rdfs prefix#
    return ret

f = open("fragen.txt", "r")
trainf = open("bb_fragen_train.json", "w")
testf = open("bb_fragen_test.json", "w")

train = [2, 3, 7, 11, 12, 15, 16, 17, 20, 21, 22, 23, 25, 27, 30, 32, 35, 36]
test = [4, 5, 6, 8, 9, 10, 13, 14, 18, 19, 24, 26, 28, 29, 31, 33, 34, 37]

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
    sparql = sparql.replace("  ", "")
    # Output in JSON format for QAnswer
    if i in train:
        traino += (
        '\n{'
        + '\n\t"sparqlKB": "SNIK_BB_DRAFT"'
        + '\n\t"knowledgebase": "SNIK_BB_DRAFT"'
        + '\n\t"question": "'
        + q
        + '",\n\t"correct": true,'
        + '\n\t"context":"[]",'
        + '\n\t"language": "en",'
        + '\n\t"id": '
        + str(i)
        + ',\n\t"sparql": "'
        + prefixToURI(sparql)
        + '",\n\t"userName": "kirdie"'
        + '\n},'
        )
    else:
        testo += (
        '\n{\n\t"question": "'
        + q
        + '",\n\t"language": "en",\n\t"id": '
        + str(i)
        + ',\n\t"sparql": "'
        + sparql
        + '"\n},'
        )
# remove last "," and close bracket
traino = traino[:-1] + "]"
testo = testo[:-1] + "]"

trainf.write(traino)
testf.write(testo)

trainf.close()
testf.close()

f.close()
