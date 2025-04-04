# Step 6
In last step you made the web3 app functional, but the syle is not that friendly. In the step, we are going to make the game pretty with power of AI. 

1. Go the lovable<br>

Go to the lovable at this website and sign up with the Github account. 

2. Upload the front-end and back-end codes<br>

For the blackjack front-end, we want AI to generate codes based on our developed codes, so it is necessary to upload our existing codes to the AI. Our front-end codes are saved in `page.tsx`, and back-end codes are saved in `route.ts`. Copy the codes from these 2 files and paste into the lovable. 

3. Add the prompt to tell AI what you want to do<br>

In the prompt, tell AI what project you are building, what stack you are using and what you want it to do for you. The example are below:
```
I am using nextjs + wagmi + tailwindcss + rainbowkit to build a blackjack game, please help to modify the front-end style to make it friendly to players. Please just modify the page.tsx. Do not create new files or modify other files. 
This is my page.tsx for front-end
...
your front-end file here 
...

This is my route.ts for back-end
...
your back-end file here
...
```

4. Wait the magic happen<br>
Lovable will generate the codes for you. Paste codes to the `page.tsx` and refresh the page.


The front-end page will convert from this:
![alt text](/imagesForReadme/ui-9.png)

to this:
![alt text](/imagesForReadme/ui-15.png)
This is the new signup page:
![alt text](/imagesForReadme/ui-16.png)