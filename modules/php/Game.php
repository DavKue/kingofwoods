<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * KingOfWoods implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * Game.php
 *
 * This is the main file for your game logic.
 *
 * In this PHP file, you are going to defines the rules of the game.
 */
declare(strict_types=1);

namespace Bga\Games\KingOfWoods;

require_once(APP_GAMEMODULE_PATH . "module/table/table.game.php");

class Game extends \Table
{
    private static array $CARD_TYPES;

    /**
     * Your global variables labels:
     *
     * Here, you can assign labels to global variables you are using for this game. You can use any number of global
     * variables with IDs between 10 and 99. If your game has options (variants), you also have to associate here a
     * label to the corresponding ID in `gameoptions.inc.php`.
     *
     * NOTE: afterward, you can get/set the global variables with `getGameStateValue`, `setGameStateInitialValue` or
     * `setGameStateValue` functions.
     */
    public function __construct()
    {
        parent::__construct();

        $this->initGameStateLabels([
            "my_first_global_variable" => 10,
            "my_second_global_variable" => 11,
            "my_first_game_variant" => 100,
            "my_second_game_variant" => 101,
        ]);        

        self::$CARD_TYPES = [
            1 => [
                "card_name" => clienttranslate('Troll'), // ...
            ],
            2 => [
                "card_name" => clienttranslate('Goblin'), // ...
            ],
            // ...
        ];

        /* example of notification decorator.
        // automatically complete notification args when needed
        $this->notify->addDecorator(function(string $message, array $args) {
            if (isset($args['player_id']) && !isset($args['player_name']) && str_contains($message, '${player_name}')) {
                $args['player_name'] = $this->getPlayerNameById($args['player_id']);
            }
        
            if (isset($args['card_id']) && !isset($args['card_name']) && str_contains($message, '${card_name}')) {
                $args['card_name'] = self::$CARD_TYPES[$args['card_id']]['card_name'];
                $args['i18n'][] = ['card_name'];
            }
            
            return $args;
        });*/
    }

    /**
     * Player action, example content.
     *
     * In this scenario, each time a player plays a card, this method will be called. This method is called directly
     * by the action trigger on the front side with `bgaPerformAction`.
     *
     * @throws BgaUserException
     */
    public function actPlayCard(int $card_id, int $target_player_id, int $covered_card): void
    {
        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        $sql = "SELECT * FROM cards WHERE card_owner = $player_id";
        $cards = $this->getCollectionFromDB($sql);

        // check input values (and find card name)
        $card_name = 'unknown';
        $validCard = false;
        foreach ($cards as $card) {
            if ($card['card_id'] == $card_id) {
                $card_name = $card['card_type'];
                $validCard = true;
            }
        }

        if ($validCard == false) {
            throw new \BgaUserException('Invalid card choice');
        }

        if ($covered_card == 0) {
            $this->DbQuery("UPDATE cards SET card_owner = $target_player_id, card_location = 'court' WHERE card_id = '$card_id'");
        } else {
            $this->DbQuery("UPDATE cards SET card_owner = $target_player_id, card_location = 'court', ontop_of =  $covered_card WHERE card_id = '$card_id'");
        }

        // Notify all players about the card played.
        $cardNofif = $this->getCollectionFromDB("SELECT * FROM cards WHERE card_id = '$card_id'");

        $this->notify->all("cardMoved", clienttranslate('${player_name} plays ${card_name} in court of ${target_player}'), [
            "cards" => array_values($cardNofif),
            "player_id" => $player_id,
            "player_name" => $this->getActivePlayerName(),
            "target_player" => $this->getPlayerNameById($target_player_id),
            "card_name" => $card_name,
            "card_id" => $card_id,
            "i18n" => ['card_name'],
        ]);

        // at the end of the action, move to the next state
        $this->gamestate->nextState("playCard");
    }

    /**
     * Game state arguments, example content.
     *
     * This method returns some additional information that is very specific to the `playerTurn` game state.
     *
     * @return array
     * @see ./states.inc.php
     */
    // public function argPlayerTurn(): array
    // {
    //     // Get some values from the current game situation from the database.



    //     return [
    //         "playableCardsIds" => [1, 2],
    //     ];
    // }

    /**
     * Compute and return the current game progression.
     *
     * The number returned must be an integer between 0 and 100.
     *
     * This method is called each time we are in a game state with the "updateGameProgression" property set to true.
     *
     * @return int
     * @see ./states.inc.php
     */
    public function getGameProgression()
    {
        // TODO: compute and return the game progression

        return 0;
    }

    /**
     * Game state action, example content.
     *
     * The action method of state `nextPlayer` is called everytime the current game state is set to `nextPlayer`.
     */

    public function stDealCards(): void {

        // Get all in-game cards and shuffle them
        $sql = "SELECT * FROM cards";
        $cards = $this->getCollectionFromDB($sql);
        shuffle($cards);
        
        $players = $this->loadPlayersBasicInfos();
        $playerCount = count($players);
        
        // Determine card distribution based on player count
        if ($playerCount == 2) {
            $cardsPerPlayer = 8;
            $asideCards = 4;
        } else { // 3 or 4 players
            $cardsPerPlayer = 7;
            $asideCards = 3;
        }

        // Split cards into player cards and aside cards
        $playerCards = array_slice($cards, 0, $cardsPerPlayer * $playerCount);
        $asideCards = array_slice($cards, $cardsPerPlayer * $playerCount, $asideCards);

        // Prepare SQL updates
        $sqlUpdates = [];

        // Distribute player cards
        $playerIndex = 0;
        foreach ($players as $playerId => $player) {
            $playerCardsChunk = array_slice($playerCards, $playerIndex * $cardsPerPlayer, $cardsPerPlayer);
            foreach ($playerCardsChunk as $card) {
                $this->DbQuery("UPDATE cards SET card_owner = '$playerId' WHERE card_id = '{$card['card_id']}'");
            }
            $playerIndex++;
        }

        // Set aside cards
        foreach ($asideCards as $card) {
            $this->DbQuery("UPDATE cards SET card_owner = 'noPlayerID', card_location = 'aside' WHERE card_id = '{$card['card_id']}'");
        }

        $allCards = $this->getCollectionFromDB("SELECT * FROM cards");
        foreach ($players as $playerId => $player) {
            $hiddenCards = $allCards;
            foreach ($allCards as $index => $card) {
                if ($card['card_owner'] != $playerId && $card['card_location'] == 'hand'){
                    $hiddenCards[$index]['card_type'] = 'hidden';
                }
            }
            $this->notify->player($playerId, 'cardMoved', '', array_values($hiddenCards) );
        }

        $this->gamestate->nextState("nextPlayer");
    } 

    public function stNextPlayer(): void {
        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        // Give some extra time to the active player when he completed an action
        $this->giveExtraTime($player_id);
        
        $this->activeNextPlayer();

        // Go to another gamestate
        // Here, we would detect if the game is over, and in this case use "endGame" transition instead 
        $this->gamestate->nextState("nextPlayer");
    }

    /**
     * Migrate database.
     *
     * You don't have to care about this until your game has been published on BGA. Once your game is on BGA, this
     * method is called everytime the system detects a game running with your old database scheme. In this case, if you
     * change your database scheme, you just have to apply the needed changes in order to update the game database and
     * allow the game to continue to run with your new version.
     *
     * @param int $from_version
     * @return void
     */
    public function upgradeTableDb($from_version)
    {
//       if ($from_version <= 1404301345)
//       {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//       }
//
//       if ($from_version <= 1405061421)
//       {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//       }
    }

    /*
     * Gather all information about current game situation (visible by the current player).
     *
     * The method is called each time the game interface is displayed to a player, i.e.:
     *
     * - when the game starts
     * - when a player refreshes the game page (F5)
     */
    protected function getAllDatas(): array
    {
        $result = [];

        // WARNING: We must only return information visible by the current player.
        $current_player_id = (int) $this->getCurrentPlayerId();

        // Get information about players.
        // NOTE: you can retrieve some extra field you added for "player" table in `dbmodel.sql` if you need it.
        $result["players"] = $this->getCollectionFromDb(
            "SELECT `player_id` `id`, `player_score` `score` FROM `player`"
        );

        // TODO: Gather all information about current game situation (visible by player $current_player_id).


        $allCards = $this->getCollectionFromDB("SELECT * FROM cards");
        $hiddenCards = $allCards;
        foreach ($allCards as $index => $card) {
            if ($card['card_owner'] != $current_player_id && $card['card_location'] == 'hand') {
                $hiddenCards[$index]['card_type'] = 'hidden';
            }
        }
        $result['cards'] = array_values($hiddenCards);

        return $result;
    }

    /**
     * Returns the game name.
     *
     * IMPORTANT: Please do not modify.
     */
    protected function getGameName()
    {
        return "kingofwoods";
    }

    /**
     * This method is called only once, when a new game is launched. In this method, you must setup the game
     *  according to the game rules, so that the game is ready to be played.
     */
    protected function setupNewGame($players, $options = [])
    {
        // Set the colors of the players with HTML color code. The default below is red/green/blue/orange/brown. The
        // number of colors defined here must correspond to the maximum number of players allowed for the gams.
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];

        foreach ($players as $player_id => $player) {
            // Now you can access both $player_id and $player array
            $query_values[] = vsprintf("('%s', '%s', '%s', '%s', '%s')", [
                $player_id,
                array_shift($default_colors),
                $player["player_canal"],
                addslashes($player["player_name"]),
                addslashes($player["player_avatar"]),
            ]);
        }

        // Create players based on generic information.
        //
        // NOTE: You can add extra field on player table in the database (see dbmodel.sql) and initialize
        // additional fields directly here.
        static::DbQuery(
            sprintf(
                "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES %s",
                implode(",", $query_values)
            )
        );

        $this->reattributeColorsBasedOnPreferences($players, $gameinfos["player_colors"]);
        $this->reloadPlayersBasicInfos();

        // Init global values with their initial values.

        // Dummy content.
        $this->setGameStateInitialValue("my_first_global_variable", 0);

        // Init game statistics.
        //
        // NOTE: statistics used in this file must be defined in your `stats.inc.php` file.

        // Dummy content.
        // $this->initStat("table", "table_teststat1", 0);
        // $this->initStat("player", "player_teststat1", 0);

        // TODO: Setup the initial game situation here.


        //Setup Cards


        $randomArray = array();
        while (count($randomArray) < 31) {
            $num = bga_rand(1, 1000);
            if (!in_array($num, $randomArray)) {
                $randomArray[] = $num;
            }
        }

        $cards2Players =  [
            "($randomArray[0], 'Assassin', 'hand', 'noPlayerID', 0)",
            "($randomArray[1], 'Assassin', 'hand', 'noPlayerID', 0)",
            "($randomArray[2], 'Assassin', 'hand', 'noPlayerID', 0)",
            "($randomArray[3], 'Trader', 'hand', 'noPlayerID', 0)",
            "($randomArray[4], 'Trader', 'hand', 'noPlayerID', 0)",
            "($randomArray[5], 'Squire', 'hand', 'noPlayerID', 0)",
            "($randomArray[6], 'Squire', 'hand', 'noPlayerID', 0)",
            "($randomArray[7], 'Guard', 'hand', 'noPlayerID', 0)",
            "($randomArray[8], 'Scholar', 'hand', 'noPlayerID', 0)",
            "($randomArray[9], 'Priest', 'hand', 'noPlayerID', 0)",
            "($randomArray[10], 'Jester', 'hand', 'noPlayerID', 0)",
            "($randomArray[11], 'Jester', 'hand', 'noPlayerID', 0)",
            "($randomArray[12], 'Jester', 'hand', 'noPlayerID', 0)",
            "($randomArray[13], 'Treasurer', 'hand', 'noPlayerID', 0)",
            "($randomArray[14], 'Treasurer', 'hand', 'noPlayerID', 0)",
            "($randomArray[15], 'Knight', 'hand', 'noPlayerID', 0)",
            "($randomArray[16], 'Knight', 'hand', 'noPlayerID', 0)",
            "($randomArray[17], 'General', 'hand', 'noPlayerID', 0)",
            "($randomArray[18], 'General', 'hand', 'noPlayerID', 0)",
            "($randomArray[19], 'Princess', 'hand', 'noPlayerID', 0)"
        ];

        $cards3Players =  [
            "($randomArray[20], 'Trader', 'hand', 'noPlayerID', 0)",
            "($randomArray[21], 'Squire', 'hand', 'noPlayerID', 0)",
            "($randomArray[22], 'Scholar', 'hand', 'noPlayerID', 0)",
            "($randomArray[23], 'Priest', 'hand', 'noPlayerID', 0)",
        ];

        $cards4Players =  [
            "($randomArray[24], 'Assassin', 'hand', 'noPlayerID', 0)",
            "($randomArray[25], 'Guard', 'hand', 'noPlayerID', 0)",
            "($randomArray[26], 'Scholar', 'hand', 'noPlayerID', 0)",
            "($randomArray[27], 'Jester', 'hand', 'noPlayerID', 0)",
            "($randomArray[28], 'Treasurer', 'hand', 'noPlayerID', 0)",
            "($randomArray[29], 'Knight', 'hand', 'noPlayerID', 0)",
            "($randomArray[30], 'General', 'hand', 'noPlayerID', 0)",
        ];
        
        $amountOfPlayers = count($players);
        if ($amountOfPlayers == 2) {
        $insertValues = $cards2Players;
        } else if ($amountOfPlayers == 3) {
            $insertValues = array_merge($cards2Players, $cards3Players);
        } else {
            $insertValues = array_merge($cards2Players, $cards3Players, $cards4Players);
        }

        $sql =
            'INSERT INTO cards (card_id, card_type, card_location, card_owner, ontop_of) VALUES ' .
            implode(',', $insertValues);
        $this->DbQuery($sql);

        // Activate first player once everything has been initialized and ready.
        $this->activeNextPlayer();
    }



    /**
     * This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
     * You can do whatever you want in order to make sure the turn of this player ends appropriately
     * (ex: pass).
     *
     * Important: your zombie code will be called when the player leaves the game. This action is triggered
     * from the main site and propagated to the gameserver from a server, not from a browser.
     * As a consequence, there is no current player associated to this action. In your zombieTurn function,
     * you must _never_ use `getCurrentPlayerId()` or `getCurrentPlayerName()`, otherwise it will fail with a
     * "Not logged" error message.
     *
     * @param array{ type: string, name: string } $state
     * @param int $active_player
     * @return void
     * @throws feException if the zombie mode is not supported at this game state.
     */
    protected function zombieTurn(array $state, int $active_player): void
    {
        $state_name = $state["name"];

        if ($state["type"] === "activeplayer") {
            switch ($state_name) {
                default:
                {
                    $this->gamestate->nextState("zombiePass");
                    break;
                }
            }

            return;
        }

        // Make sure player is in a non-blocking status for role turn.
        if ($state["type"] === "multipleactiveplayer") {
            $this->gamestate->setPlayerNonMultiactive($active_player, '');
            return;
        }

        throw new \feException("Zombie mode not supported at this game state: \"{$state_name}\".");
    }
}
