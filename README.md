# Step 2
After step 1, we have created a front-end with fake data. In this step, we are going to complete back-end to return data to front-end.


1. Create a api route<br>
Create `api` folder under directory `src/app` and create the file `route.ts`.

2. Develop back-end functions in `src/app/api/`<br>
- start the game and get 2 cards for dealer and player
- Handle Hit and stand and decide who is the winner

3. Complete logics for start game<br>
Write start game logics in `GET()`.

4. Complete logics for hit and stand<br>
Write hit and stand logics in `POST()`.

5. Call the function in front-end<br>
Write functions to make GET and POST call in file `src/app/page.tsx`

6. Switch the bg-color based on `message`

7. Hide the display buttons for hit, stand and reset<br>

8. Add score for players<br>
Add attribute `score` into the `gameState`. player win => +100. player lose => -100. 

8. After development, MVP is completed and the game is OK to play. Try to see how many scores you can get.
![alt text](/imagesForReadme/ui-2.png)