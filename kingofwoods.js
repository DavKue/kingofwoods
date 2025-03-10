/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * KingOfWoods implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * kingofwoods.js
 *
 * KingOfWoods user interface script
 * 
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
],
function (dojo, declare) {
    return declare("bgagame.kingofwoods", ebg.core.gamegui, {
        constructor: function(){
            console.log('kingofwoods constructor');
              
            // Here, you can init the global variables of your user interface
            // Example:
            // this.myGlobalValue = 0;

            this.playerStocks = {}; // Stores stocks for each player { playerId: { hand, court } }
            this.cardTypeMap = {
                'Assassin': 1,
                'Trader': 2,
                'Guard': 3,
                'Squire': 4,
                'Scholar': 5,
                'Priest': 6,
                'Jester': 7,
                'Treasurer': 8,
                'Knight': 9,
                'General': 10,
                'Princess': 11,
                'Backside': 12
            };
            this.slideDuration = 500;
            this.selectedCardId = null;

        },
        
        /*
            setup:
            
            This method must set up the game user interface according to current game situation specified
            in parameters.
            
            The method is called each time the game interface is displayed to a player, ie:
            _ when the game starts
            _ when a player refreshes the game page (F5)
            
            "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
        */
        
        setup: function( gamedatas )
        {
            console.log( "Starting game setup" );

            // // Example to add a div on the game area
            // document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
            //     <div id="player-tables"></div>
            // `);
            
            // // Setting up player boards
            // Object.values(gamedatas.players).forEach(player => {
            //     // example of setting up players boards
            //     this.getPlayerPanelElement(player.id).insertAdjacentHTML('beforeend', `
            //         <div id="player-counter-${player.id}">A player counter</div>
            //     `);

            //     // example of adding a div for each player
            //     document.getElementById('player-tables').insertAdjacentHTML('beforeend', `
            //         <div id="player-table-${player.id}">
            //             <strong>${player.name}</strong>
            //             <div>Player zone content goes here</div>
            //         </div>
            //     `);
            // });
            
            // TODO: Set up your game interface here, according to "gamedatas"
            
            // Create main game containers
            document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
                <div id="player-tables"></div>
            `);

            // Initialize all player stocks
            this.initializePlayerStocks(gamedatas.players);
            
            // Load initial card positions
            this.updateCardDisplay(gamedatas.cards);


            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();

            console.log( "Ending game setup" );
        },
       

        ///////////////////////////////////////////////////
        //// Game & client states
        
        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  You can use this method to perform some user interface changes at this moment.
        //
        onEnteringState: function( stateName, args )
        {
            console.log( 'Entering state: '+stateName, args );
            
            switch( stateName )
            {
            
            /* Example:
            
            case 'myGameState':
            
                // Show some HTML block at this game state
                dojo.style( 'my_html_block_id', 'display', 'block' );
                
                break;
           */
           
           
            case 'dummy':
                break;
            }
        },

        // onLeavingState: this method is called each time we are leaving a game state.
        //                 You can use this method to perform some user interface changes at this moment.
        //
        onLeavingState: function( stateName )
        {
            console.log( 'Leaving state: '+stateName );
            
            switch( stateName )
            {
            
            /* Example:
            
            case 'myGameState':
            
                // Hide the HTML block we are displaying only during this game state
                dojo.style( 'my_html_block_id', 'display', 'none' );
                
                break;
           */
           
           
            case 'dummy':
                break;
            }               
        }, 

        // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
        //                        action status bar (ie: the HTML links in the status bar).
        //        
        onUpdateActionButtons: function( stateName, args )
        {
            console.log( 'onUpdateActionButtons: '+stateName, args );
                    
            // Clear previous actions
            this.statusBar.removeActionButtons()

            if( this.isCurrentPlayerActive() )
            {            
                switch( stateName )
                {
                 case 'playerTurn':    
                    break;
                }
            }
        },        

        ///////////////////////////////////////////////////
        //// Utility methods
        
        /*
        
            Here, you can defines some utility methods that you can use everywhere in your javascript
            script.
        
        */

        initializePlayerStocks: function(players) {
            const playerTables = document.getElementById('player-tables');
            Object.values(players).forEach(player => {
                // Create player area
                const playerDiv = document.createElement('div');
                playerDiv.className = 'player-area';
                playerDiv.innerHTML = `
                    <div class="player-header" style="color: #${player.color};">
                        <strong>${player.name}</strong>
                    </div>
                    <div class="player-zones">
                        <div class="zone hand-zone">
                            <div class="zone-label">Hand</div>
                            <div class="hand-container" id="hand-${player.id}"></div>
                        </div>
                        <div class="zone court-zone">
                            <div class="zone-label">Court</div>
                            <div class="court-container" id="court-${player.id}"></div>
                        </div>
                    </div>
                `;
                playerTables.appendChild(playerDiv);

                // Initialize Hand Stock
                const handStock = new ebg.stock();
                handStock.create(this, $(`hand-${player.id}`), 768, 1181);
                this.configureStock(handStock);

                // Initialize Court Stock
                const courtStock = new ebg.stock();
                courtStock.create(this, $(`court-${player.id}`), 768, 1181);
                this.configureStock(courtStock);

                // Store references
                this.playerStocks[player.id] = { hand: handStock, court: courtStock };
            });
        },

        configureStock: function(stock) {
            stock.setSelectionAppearance('none');
            stock.image_items_per_row = 4;
            stock.item_image_url = g_gamethemeurl + 'img/KotW_Cards_Spreadsheet.jpg';
            
            // Calculate scaled dimensions
            const cardScale = 0.20; // Start with 30% size
            const baseCardWidth = 768;
            const baseCardHeight = 1181;
            const baseSpriteWidth = 3072;
            const baseSpriteHeight = 3543;
            const scaledCardWidth = baseCardWidth * cardScale;
            const scaledCardHeight = baseCardHeight * cardScale;
            const scaledSpriteWidth = baseSpriteWidth * cardScale;
            const scaledSpriteHeight = baseSpriteHeight * cardScale;
            // Resize stock items
            stock.resizeItems(
                scaledCardWidth,                   // Display width
                scaledCardHeight,                  // Display height
                scaledSpriteWidth,            // Original sprite width
                scaledSpriteHeight            // Original sprite height
            );


            // Add card types to each stock
            Object.entries(this.cardTypeMap).forEach(([name, typeId]) => {
                stock.addItemType(
                    typeId,
                    1, // Weight
                    stock.item_image_url,
                    typeId - 1 // Position index
                );
            });

            stock.setSelectionMode(1); // Allow single selection
            dojo.connect(stock, 'onChangeSelection', this, 'onCardSelection');
        },

        updateCardDisplay: function(cards) {
            // Ensure array
            if (!Array.isArray(cards)) cards = [cards];
            console.log('cards:', cards);
            cards.forEach(card => {
                console.log('playerStocks:', this.playerStocks);
                if (card.card_location == 'aside') {
                    return;
                }
                // Find current stock
                const fromStock = this.findCardStock(card.card_id);
                const targetPlayerId = card.card_owner;
                const toStock = card.card_location == 'court' ? 
                    this.playerStocks[targetPlayerId].court : 
                    this.playerStocks[targetPlayerId].hand;
                const typeId = this.cardTypeMap[card.card_type] || this.cardTypeMap['Backside'];
                if (fromStock && fromStock !== toStock) {
                    // Animate movement between stocks
                    fromStock.moveToAnotherStock(
                        card.card_id,
                        toStock,
                        this.slideDuration
                    );
                } else if (!fromStock) {
                    // New card - add with animation
                    toStock.addToStockWithId(
                        typeId,
                        card.card_id
                    );
                }
            });
        },
        
        // Helper to find which stock contains a card
        findCardStock: function(cardId) {
            for (const playerId in this.playerStocks) {
                const { hand, court } = this.playerStocks[playerId];
                if (hand.items[cardId]) return hand;
                if (court.items[cardId]) return court;
            }
            return null;
        },

        showPlayerTargets: function(cardId) {
            this.statusBar.removeActionButtons()
            
            // Get all players (including self)
            const players = this.gamedatas.players;
            
            // Add buttons for each player
            Object.values(players).forEach(player => {
                this.statusBar.addActionButton(
                    _('Play to ${player_name}\'s court').replace('${player_name}', player.name),
                    () => this.confirmCardPlay(cardId, player.id),
                    { color: player.color }
                );
            });
            
            // Add cancel button
            this.statusBar.addActionButton(
                _('Cancel'),
                () => this.cancelCardSelection(),
                { color: 'secondary' }
            );
        },

        ///////////////////////////////////////////////////
        //// Player's action
        
        /*
        
            Here, you are defining methods to handle player's action (ex: results of mouse click on 
            game objects).
            
            Most of the time, these methods:
            _ check the action is possible at this game state.
            _ make a call to the game server
        
        */
        
        // Example:
        
        onCardSelection: function(controlName, itemId) {
            const stock = this.getStockFromControlName(controlName);
            const selectedItems = stock.getSelectedItems();
            
            if (selectedItems.length > 0) {
                const cardId = selectedItems[0].id;
                this.onCardClick(cardId);
            }
            
            stock.unselectAll();
        },
        
        // Helper to get stock from control name:
        getStockFromControlName: function(controlName) {
            for (const playerId in this.playerStocks) {
                const stocks = this.playerStocks[playerId];
                if (stocks.hand.control_name === controlName) return stocks.hand;
                if (stocks.court.control_name === controlName) return stocks.court;
            }
            return null;
        },
        
        // Modified card click handler:
        onCardClick: function(cardId) {
            console.log('Card clicked:', cardId);
            
            // Clear previous buttons
            this.statusBar.removeActionButtons()
            
            if (!this.selectedCardId) {
                // First selection - show player targets
                this.selectedCardId = cardId;
                this.showPlayerTargets(cardId);
            }
        },

        confirmCardPlay: function(cardId, targetPlayerId) {
            this.bgaPerformAction("actPlayCard", {
                card_id: cardId,
                target_player_id: targetPlayerId
            }).then(() => {
                this.clearSelection();
            });
        },
        
        cancelCardSelection: function() {
            // Refresh action buttons to default state
            this.clearSelection();
            this.statusBar.removeActionButtons()
            this.onUpdateActionButtons('playerTurn', this.gamedatas.actionArgs);
        },
        
        clearSelection: function() {
            this.selectedCardId = null;
            this.statusBar.removeActionButtons()
        },

        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        /*
            setupNotifications:
            
            In this method, you associate each of your game notifications with your local method to handle it.
            
            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your kingofwoods.game.php file.
        
        */
        setupNotifications: function()
        {
            console.log( 'notifications subscriptions setup' );
            
            // TODO: here, associate your game notifications with local methods
            
            // Example 1: standard notification handling
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            
            // Example 2: standard notification handling + tell the user interface to wait
            //            during 3 seconds after calling the method in order to let the players
            //            see what is happening in the game.
            // dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
            // this.notifqueue.setSynchronous( 'cardPlayed', 3000 );
            // 

            dojo.subscribe('cardMoved', this, notif => {
                // Ensure we always get an array
                const cards = Array.isArray(notif.args.cards) ? 
                    notif.args.cards : 
                    [notif.args.cards];
                
                this.updateCardDisplay(cards);
            });
            this.notifqueue.setSynchronous('cardMoved', 500);
        },  
        
        // TODO: from this point and below, you can write your game notifications handling methods
        
        /*
        Example:
        
        notif_cardPlayed: function( notif )
        {
            console.log( 'notif_cardPlayed' );
            console.log( notif );
            
            // Note: notif.args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call
            
            // TODO: play the card in the user interface.
        },    
        
        */
   });             
});
