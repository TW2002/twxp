# Mombot Wiki

This folder is a TiddlyWiki workspace for a single-file Mombot reference wiki.

The flow is:

1. Import live Mombot help and source-topic metadata from `/Users/mosleym/twx/scripts/mombot/...`
2. Merge that generated content with editable guide tiddlers in `twxwiki/tiddlers`
3. Render a standalone HTML wiki

Build it with:

```bash
python3 /Users/mosleym/Code/twxproxy/TWX30/twxwiki/scripts/build_mombot_wiki.py
```

To omit specific commands or modes from the generated wiki, add them one per line to:

- `/Users/mosleym/Code/twxproxy/TWX30/twxwiki/skip-topics.txt`

The importer rewrites only:

- `/Users/mosleym/Code/twxproxy/TWX30/twxwiki/tiddlers/generated-mombot`

Put your own content in the non-generated tiddlers so it survives rebuilds.

Built output lands at:

- `/Users/mosleym/Code/twxproxy/TWX30/twxwiki/output/mombot-wiki.html`
