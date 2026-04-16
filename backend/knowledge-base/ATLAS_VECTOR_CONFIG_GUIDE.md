# 🧠 MongoDB Atlas Vector Search Guide

Because your cloud cluster is securely managed by MongoDB Atlas, you must manually define the mathematical bounds of your AI vectors via their dashboard.

Follow these steps **exactly** before running the database queries:

### 1. Create the Collection
1. Log into [MongoDB Atlas](https://cloud.mongodb.com/).
2. Click **Database** -> **Browse Collections**.
3. Under the `vaidyasetu` database, click **+ Create Collection**.
4. Name the collection exactly: `knowledge_chunks`

### 2. Configure the Vector Index
1. In your Atlas Dashboard top navigation, click **Search**.
2. Click **Create Search Index**.
3. Under *Configuration Method*, choose **JSON Editor**.
4. Select `vaidyasetu` as your Database and `knowledge_chunks` as your Collection.
5. In the *Index Name* field, type exactly: `vector_index`
6. Paste the following JSON mapping into the editor:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "source_database"
    },
    {
      "type": "filter",
      "path": "content_type"
    }
  ]
}
```
7. Click **Create Index**.

### 3. Wait for Activation
Atlas will now provision dedicated search hardware on your cluster. It usually takes 5-15 minutes. 
**When the status changes from "Building" to "Active", you are ready!**
