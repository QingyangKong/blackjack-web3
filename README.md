# Step 3
After step 2, we have created a front-end and back-end for the Black Jack game. For the player, we set a rule that player get +100 if wins, -100 if loses. 
While there is a score for the player in last step, the data saved in the back-end of the server. In the design, all players share the same score. In the step:
- We create a records for different players. 
- We save use a DB to store the score of the players in the long term. 


1. Create table in the AWS dynamoDB<br>
Sign up a free AWS account and login with the root user. 

2. Create a table in DynamoDB<br>
- Search the "DynamoDB" in the search bar on the top left. 
- Click the tab "Tables" on the left panel
- Click button "Create table" on the top right
- Input "BlackJack" for table name
- Input "player" for partition key and the data type is "string". 
- Leave blank for sort key 
- Use the Default settings for the table.
- Click button "Create table" in the bottom of the page and table is like below. 
![alt text](/imagesForReadme/ui-3.png)

3. Create IAM account for DynamoDB
In order to access the dynamoDB table you just created, you have to create an IAM account with the correct permission.
- Search "IAM" in the search bar on the top left.
- On the left panel, under the "Access management", click "Users"
- Click the button "Create user" on the top right.
- Input "DBuser" as user name and click "next". You don't need to provide user access to the AWS managment console. 
- In the "set permission" page, select "Add user to group" and create a group "db-Group". 
- Once the group created, add "AmazonDynamoDBFullAccess" to the group and check the group for the user "DBUser". 
- Click "next" and go to page "Review and create" click "Create user" at the bottom right. 
![alt text](/imagesForReadme/ui-4.png)

4. Create access credentials for IAM
- Click the user "DBUser" and click "generate access key". 
- Select "Local code" for the Access key and click "next". 
- Retrieve the access keys. Please notice: this is the only time that secret key can be viewed or downloaded. Save the secret key somewhere safe. 
![alt text](/imagesForReadme/ui-5.png)

5. Save the credentials as env var
In the `.env.local`, create 2 variables like:
```
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
```
with the ID and secret, you can read and write data to the AWS dynamoDB. Free plan for DynamoDN is fewer than 20 units per second so the service is enough for the demo.

6. Add utility for DynamoDB in route
Install dynamoDB dependencies:
```
pnpm add @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```
Add functions to put and get items from dynamoDB in API file. 

7. Create a function to update the score
Create a function to update score for the player, and make it called at the end of the `POST()` to update scores in DynamoDB.

You can see record is created and updated.
![alt text](/imagesForReadme/ui-6.png)