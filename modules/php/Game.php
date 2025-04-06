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

        // check if card is a valid pick (and find card name)
        $sql = "SELECT * FROM cards";
        $cards = $this->getCollectionFromDB($sql);

        $card_name = 'unknown';
        $ownedCard = false;
        $squireInCourt = false;
        $squireInHand = false;
        $inCourtAll = 0;
        $assassinsInCourt = 0;
        foreach ($cards as $card) {
            if ($card['card_id'] == $card_id && $card['card_owner'] == $player_id && $card['card_location'] == 'hand') {
                $card_name = $card['card_type'];
                $ownedCard = true;
            }
            if ($card['card_type'] == 'Squire' && $card['card_location'] == 'court') {
                $squireInCourt = true;
            }
            if ($card['card_type'] == 'Squire' && $card['card_owner'] == $player_id && $card['card_location'] == 'hand') {
                $squireInHand = true;
            }
            if ($card['card_owner'] == $player_id && $card['card_location'] == 'court') {
                $inCourtAll = $inCourtAll + 1;
                if ($card['card_type'] == 'Assassin') {
                    $assassinsInCourt = $assassinsInCourt + 1;
                }
            }
        }

        if ($ownedCard == false) {
            throw new \BgaUserException('You dont own this card');
        }
        if ($squireInCourt === true && $squireInHand === true && $card_name != 'Squire') {
            throw new \BgaUserException('You have to play a squire');
        }
        if ($card_name == 'Princess' && ($inCourtAll - $assassinsInCourt) < 3) {
            throw new \BgaUserException('You don´t have enough cards in that court to play the princess');
        }

        //Play card
        if ($covered_card == 0) {
            $this->DbQuery("UPDATE cards SET card_owner = $target_player_id, card_location = 'court' WHERE card_id = '$card_id'");
        } else {
            //assassin-play
            $sql2 = "SELECT * FROM cards WHERE card_owner = $target_player_id AND card_location = 'court'";
            $targetCards = $this->getCollectionFromDB($sql2);
            $alreadyCovered = false;
            $otherAssassinID = false;
            foreach ($targetCards as $card) {
                if ($card['ontop_of'] == $covered_card) {
                    $alreadyCovered = true;
                    $otherAssassinID = $card['card_id'];
                }
            }

            if ($alreadyCovered === false) {
                $this->DbQuery("UPDATE cards SET card_owner = $target_player_id, card_location = 'court', ontop_of = $covered_card WHERE card_id = '$card_id'");
            } else {
                $this->DbQuery("UPDATE cards SET card_owner = 'noPlayerID', card_location = 'aside', ontop_of = 0 WHERE card_id = '$card_id'");
                $this->DbQuery("UPDATE cards SET card_owner = 'noPlayerID', card_location = 'aside', ontop_of = 0 WHERE card_id = '$otherAssassinID'");
                $assassinKill = [
                    'killer' => $card_id,
                    'victim' => $otherAssassinID,
                ];
                $this->notify->all("assassinKill", '', $assassinKill);
            }
            
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

        if ($card_name == 'Treasurer' && $player_id != $target_player_id) {
            $sql = "SELECT * FROM cards WHERE card_owner = $target_player_id";
            $targetCards = $this->getCollectionFromDB($sql);

            $handCards = false;
            $handCardsCollection = [];
            foreach ($targetCards as $card) {
                if ($card['card_location'] == 'hand') {
                    $handCards = true;
                    $handCardsCollection[] = $card;
                }
            }

            $cardIds = array_column($handCardsCollection, 'card_id');
            if ($handCards == false) {
                $this->notify->all("logText", clienttranslate('Treasurer-Effect: ${player_name} took no card, because ${target_player} had no cards in the hand'), [
                    "player_name" => $this->getPlayerNameById($player_id),
                    "target_player" => $this->getPlayerNameById($target_player_id),
                ]);
                throw new \BgaUserException('No cards available for selection.');
            } else {
                $randomIndex = random_int(0, count($cardIds) - 1);
                $randomCardId = $cardIds[$randomIndex];
                $this->DbQuery("UPDATE cards SET card_owner = $player_id, card_location = 'hand', ontop_of = 0 WHERE card_id = '$randomCardId'");
                //Moved card for all
                $cardNofif = $this->getCollectionFromDB("SELECT * FROM cards WHERE card_id = '$randomCardId'");
                $players = $this->loadPlayersBasicInfos();
                foreach ($players as $thisPlayer_id => $info) {
                    $hiddenCards = $cardNofif;
                    foreach ($cardNofif as $index => $card) {
                        if ($card['card_owner'] != $thisPlayer_id && $card['card_location'] == 'hand') {
                            $hiddenCards[$index]['card_type'] = 'hidden';
                        }
                    }
                    $this->notify->player($thisPlayer_id,"cardMoved", clienttranslate('Treasurer-Effect: ${player_name} took a random card from the hand of ${target_player}'), [
                        "cards" => array_values($hiddenCards),
                        "player_id" => $player_id,
                        "player_name" => $this->getActivePlayerName(),
                        "target_player" => $this->getPlayerNameById($target_player_id),
                        "card_id" => $randomCardId,
                        "i18n" => ['card_name'],
                    ]);
                }
            }
        }

        if ($card_name == 'General' && $player_id != $target_player_id) {
            $sql = "SELECT * FROM cards";
            $allCards = $this->getCollectionFromDB($sql);

            foreach ($allCards as $key => $card) {
                if ($card['card_location'] == 'hand' && $card['card_owner'] == $player_id) {
                    $this->DbQuery("UPDATE cards SET card_owner = $target_player_id WHERE card_id = '$key'");
                }
                if ($card['card_location'] == 'hand' && $card['card_owner'] == $target_player_id) {
                    $this->DbQuery("UPDATE cards SET card_owner = $player_id WHERE card_id = '$key'");
                }
            }

            //Moved card for all
            $cardNofif = $this->getCollectionFromDB("SELECT * FROM cards");
            $players = $this->loadPlayersBasicInfos();
            foreach ($players as $thisPlayer_id => $info) {
                $hiddenCards = $cardNofif;
                foreach ($cardNofif as $index => $card) {
                    if ($card['card_owner'] != $thisPlayer_id && $card['card_location'] == 'hand') {
                        $hiddenCards[$index]['card_type'] = 'hidden';
                    }
                }
                $this->notify->player($thisPlayer_id,"cardMoved", clienttranslate('General-Effect: ${player_name} exchanged hand cards with ${target_player}'), [
                    "cards" => array_values($hiddenCards),
                    "player_id" => $player_id,
                    "player_name" => $this->getActivePlayerName(),
                    "target_player" => $this->getPlayerNameById($target_player_id),
                    "i18n" => ['card_name'],
                ]);
            }

        }

        // at the end of the action, move to the next state
        if ($card_name == 'Knight' && $player_id != $target_player_id) {
            $sql = "SELECT * FROM cards WHERE card_owner = '$target_player_id'";
            $cards = $this->getCollectionFromDB($sql);
            $targetHand = false;
            foreach ($cards as $card) {
                if ($card['card_location'] == 'hand') {
                    $targetHand = true;
                }
            }
            if ($targetHand == false) {
                $this->notify->all("logText", clienttranslate('Knight-Effect: ${target_player} had no hand-cards to choose from'), [
                    "player_name" => $this->getPlayerNameById($player_id),
                    "target_player" => $this->getPlayerNameById($target_player_id),
                ]);
                $this->gamestate->nextState("playCard");
                return;
            }

            $res = json_encode($target_player_id);
            $this->DbQuery(
                "UPDATE ingame SET value='$res' WHERE name = 'targetPlayer'"
            );
            $this->notify->all('targetPlayer', '', [$target_player_id] );

            // Notify active player about hand cards.
            $cardNofif = $this->getCollectionFromDB("SELECT * FROM cards WHERE card_owner = '$target_player_id'");
            $this->notify->player($player_id,"cardMoved", '', [
                "cards" => array_values($cardNofif),
            ]);
            $this->gamestate->nextState("playedKnight");
            return;
        }
        if ($card_name == 'Trader' && $player_id != $target_player_id) {
            $sql = "SELECT * FROM cards";
            $cards = $this->getCollectionFromDB($sql);
            $playerCard = false;
            $targetCard = false;
            foreach ($cards as $card) {
                if ($card['card_owner'] == $player_id && $card['card_location'] == 'hand') {
                    $playerCard = true;
                }
                if ($card['card_owner'] == $target_player_id && $card['card_location'] == 'hand') {
                    $targetCard = true;
                }
            }
            if ($playerCard == false || $targetCard == false) {
                $this->notify->all("logText", clienttranslate('Trader-Effect: Trade not possible'), ['']);
                $this->gamestate->nextState("playCard");
                return;
            }

            $res = json_encode($target_player_id);
            $this->DbQuery(
                "UPDATE ingame SET value='$res' WHERE name = 'targetPlayer'"
            );
            $this->notify->all('targetPlayer', '', [$target_player_id] );

            $this->gamestate->nextState("playedTrader");
            return;
        }
        if ($card_name == 'Scholar' && $player_id != $target_player_id) {
            $sql = "SELECT * FROM cards WHERE card_owner = $target_player_id AND card_location = 'court'";
            $targetCards = $this->getCollectionFromDB($sql);
            $coveredCards = [];
            foreach ($cards as $card) {
                if ($card['ontop_of'] != 0) {
                    $coveredCards[] = $card['ontop_of'];
                }
            }
            $validCard = false;
            foreach ($targetCards as $card) {
                if ($card['card_type'] != 'Assassin' && $card['card_type'] != 'Scholar' && !in_array($card['card_id'], $coveredCards)) {
                    $validCard = true;
                }
            }

            if ($validCard === false) {
                $this->notify->all("logText", clienttranslate('Scholar-Effect: There was no valid card in the court of ${target_player}'), [
                    "player_name" => $this->getPlayerNameById($player_id),
                    "target_player" => $this->getPlayerNameById($target_player_id),
                ]);
            } else {
                $res = json_encode($target_player_id);
                $this->DbQuery(
                    "UPDATE ingame SET value='$res' WHERE name = 'targetPlayer'"
                );
                $this->notify->all('targetPlayer', '', [$target_player_id] );
    
                $this->gamestate->nextState("playedScholar");
                return;
            }
        }
        if ($card_name == 'Priest') {
            $res = json_encode($target_player_id);
            $this->DbQuery(
                "UPDATE ingame SET value='$res' WHERE name = 'targetPlayer'"
            );
            $this->notify->all('targetPlayer', '', [$target_player_id] );

            $res2 = json_encode($card_id);
            $this->DbQuery(
                "UPDATE ingame SET value='$res2' WHERE name = 'blockedCard'"
            );
            $this->notify->all('blockedCard', '', [$card_id] );

            $this->gamestate->nextState("playedPriest");
            return;
        }
        $this->gamestate->nextState("playCard");
    }

    public function actSelectionKnight(int $card_id): void
    {
        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        $data = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'targetPlayer'"
        );
        $targetPlayer = json_decode($data['targetPlayer']['value'], true);
            
        $sql = "SELECT * FROM cards WHERE card_owner = $targetPlayer AND card_location = 'hand'";
        $cards = $this->getCollectionFromDB($sql);

        // check input values (and find card name)
        $card_name = 'unknown';
        $squireInHand = false;
        $validCard = false;
        foreach ($cards as $card) {
            if ($card['card_id'] == $card_id) {
                $card_name = $card['card_type'];
                $validCard = true;
            }
            if ($card['card_type'] == 'Squire') {
                $squireInHand = true;
            }
        }

        if ($squireInHand === true && $card_name != 'Squire') {
            throw new \BgaUserException('You must choose a squire');
        }

        if ($validCard == false) {
            throw new \BgaUserException('Invalid card choice');
        }

        $this->DbQuery("UPDATE cards SET card_owner = $player_id, card_location = 'hand', ontop_of = 0 WHERE card_id = '$card_id'");

        $res = json_encode('noPlayerID');
        $this->DbQuery(
            "UPDATE ingame SET value='$res' WHERE name = 'targetPlayer'"
        );
        $this->notify->all('targetPlayer', '', ['noPlayerID'] );

        //Moved card for all
        $cardNofif = $this->getCollectionFromDB("SELECT * FROM cards WHERE card_id = '$card_id'");
        $players = $this->loadPlayersBasicInfos();
        foreach ($players as $thisPlayer_id => $info) {
            $hiddenCards = $cardNofif;
            foreach ($cardNofif as $index => $card) {
                if ($card['card_owner'] != $thisPlayer_id && $card['card_location'] == 'hand') {
                    $hiddenCards[$index]['card_type'] = 'hidden';
                }
            }
            $this->notify->player($thisPlayer_id,"cardMoved", clienttranslate('Knight-Effect: ${player_name} took a card from the hand of ${target_player}'), [
                "cards" => array_values($hiddenCards),
                "player_id" => $player_id,
                "player_name" => $this->getActivePlayerName(),
                "target_player" => $this->getPlayerNameById($targetPlayer),
                "card_id" => $card_id,
                "i18n" => ['card_name'],
            ]);
        }

        //Hide Target Players hand
        $cardNofifActivePlayer = $this->getCollectionFromDB("SELECT * FROM cards WHERE card_owner = '$targetPlayer'");
        $hiddenCards = $cardNofifActivePlayer;
        foreach ($cardNofifActivePlayer as $index => $card) {
            if ($card['card_location'] == 'hand') {
                $hiddenCards[$index]['card_type'] = 'hidden';
            }
        }
        $this->notify->player($player_id,"cardMoved", '', [
            "cards" => array_values($hiddenCards),
        ]);

        $this->gamestate->nextState("playCard");
    }

    public function actSelectionTraderPlayer(int $card_id): void
    {
        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        $data = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'targetPlayer'"
        );
        $targetPlayer = json_decode($data['targetPlayer']['value'], true);
            
        $sql = "SELECT * FROM cards WHERE card_owner = $player_id AND card_location = 'hand'";
        $cards = $this->getCollectionFromDB($sql);

        // check input values (and find card name)
        $card_name = 'unknown';
        $validCard = false;
        foreach ($cards as $card) {
            if ($card['card_id'] == $card_id) {
                $validCard = true;
                $card_name = $card['card_type'];
            }
        }

        if ($validCard == false) {
            throw new \BgaUserException('Invalid card choice');
        }

        $this->DbQuery("UPDATE cards SET card_owner = $targetPlayer, card_location = 'hand', ontop_of = 0 WHERE card_id = '$card_id'");

        //Moved card for all
        $cardNofif = $this->getCollectionFromDB("SELECT * FROM cards WHERE card_id = '$card_id'");
        $players = $this->loadPlayersBasicInfos();
        foreach ($players as $thisPlayer_id => $info) {
            $hiddenCards = $cardNofif;
            foreach ($cardNofif as $index => $card) {
                if ($card['card_owner'] != $thisPlayer_id && $card['card_location'] == 'hand') {
                    $hiddenCards[$index]['card_type'] = 'hidden';
                }
            }
            $this->notify->player($thisPlayer_id,"cardMoved", clienttranslate('Trader-Effect: ${player_name} gave a card to ${target_player}'), [
                "cards" => array_values($hiddenCards),
                "player_id" => $player_id,
                "player_name" => $this->getActivePlayerName(),
                "target_player" => $this->getPlayerNameById($targetPlayer),
                "card_id" => $card_id,
                "i18n" => ['card_name'],
            ]);
        }

        $res = json_encode($player_id);
        $this->DbQuery(
            "UPDATE ingame SET value='$res' WHERE name = 'targetPlayer'"
        );
        $this->notify->all('targetPlayer', '', [$player_id] );

        $res2 = json_encode($targetPlayer);
        $this->DbQuery(
            "UPDATE ingame SET value='$res2' WHERE name = 'specialActivePlayer'"
        );
        $this->notify->all('specialActivePlayer', '', [$targetPlayer] );

        $targetInfluence = $this->cards[$card_name]['influence'];
        $res3 = json_encode($targetInfluence);
        $this->DbQuery(
            "UPDATE ingame SET value='$res3' WHERE name = 'targetInfluence'"
        );
        $this->notify->all('targetInfluence', '', [$targetInfluence] );

        $res4 = json_encode($card_id);
        $this->DbQuery(
            "UPDATE ingame SET value='$res4' WHERE name = 'blockedCard'"
        );
        $this->notify->all('blockedCard', '', [$card_id] );

        $this->gamestate->nextState("activatePlayer");
    } 

    public function actSelectionTraderOpponent(int $card_id): void
    {
        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        $data = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'targetPlayer'"
        );
        $targetPlayer = json_decode($data['targetPlayer']['value'], true);

        $data2 = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'targetInfluence'"
        );
        $targetInfluence = json_decode($data2['targetInfluence']['value'], true);
            
        $sql = "SELECT * FROM cards WHERE card_owner = $player_id AND card_location = 'hand'";
        $cards = $this->getCollectionFromDB($sql);

        // check input values (and find card name)
        $card_name = 'unknown';
        $validCard = false;
        $selectedInfluence = 0;
        $highestInfluence = 0;
        foreach ($cards as $card) {
            $thisInfluence = $this->cards[$card['card_type']]['influence'];
            if ($card['card_id'] == $card_id) {
                $validCard = true;
                $selectedInfluence = $thisInfluence;
                $card_name = $card['card_type'];
            }
            if ($thisInfluence > $highestInfluence) {
                $highestInfluence = $thisInfluence;
            }
        }

        if ($validCard == false) {
            throw new \BgaUserException('Invalid card choice');
        }

        if ($selectedInfluence <= $targetInfluence && $selectedInfluence != $highestInfluence) {
            throw new \BgaUserException('Influence not high enough');
        }

        $this->DbQuery("UPDATE cards SET card_owner = $targetPlayer, card_location = 'hand', ontop_of = 0 WHERE card_id = '$card_id'");

        //Moved card for all
        $cardNofif = $this->getCollectionFromDB("SELECT * FROM cards WHERE card_id = '$card_id'");
        $players = $this->loadPlayersBasicInfos();
        foreach ($players as $thisPlayer_id => $info) {
            $hiddenCards = $cardNofif;
            foreach ($cardNofif as $index => $card) {
                if ($card['card_owner'] != $thisPlayer_id && $card['card_location'] == 'hand') {
                    $hiddenCards[$index]['card_type'] = 'hidden';
                }
            }
            $this->notify->player($thisPlayer_id,"cardMoved", clienttranslate('Trader-Effect: ${player_name} gave a card to ${target_player}'), [
                "cards" => array_values($hiddenCards),
                "player_id" => $player_id,
                "player_name" => $this->getActivePlayerName(),
                "target_player" => $this->getPlayerNameById($targetPlayer),
                "card_id" => $card_id,
                "i18n" => ['card_name'],
            ]);
        }

        $this->gamestate->nextState("backToPreviousPlayer");
    } 

    public function actSelectionScholar(int $card_id): void
    {
        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        $data = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'targetPlayer'"
        );
        $targetPlayer = json_decode($data['targetPlayer']['value'], true);
            
        $sql = "SELECT * FROM cards WHERE card_owner = $targetPlayer AND card_location = 'court'";
        $cards = $this->getCollectionFromDB($sql);

        // check input values (and find card name)
        $card_name = 'unknown';
        $validCard = false;
        $influenceUnderFive = false;
        $coveredCards = [];
        foreach ($cards as $card) {
            if ($card['ontop_of'] != 0) {
                $coveredCards[] = $card['ontop_of'];
            }
        }
        foreach ($cards as $card) {
            if ($card['card_id'] == $card_id && !in_array($card['card_id'], $coveredCards)) {
                $card_name = $card['card_type'];
                $validCard = true;
            }
            if ($this->cards[$card['card_type']]['influence'] > 5 && $card['card_type'] != 'Assassin' && $card['card_type'] != 'Scholar' && !in_array($card['card_id'], $coveredCards)) {
                $influenceUnderFive = true;
            }
        }
        $cardInit = $this->cards[$card_name]['influence'];

        if ($validCard == false) {
            throw new \BgaUserException('Invalid card choice');
        }

        if ($influenceUnderFive === true && $cardInit > 4) {
            throw new \BgaUserException('Pick a card with lower influence');
        }

        $this->DbQuery("UPDATE cards SET card_owner = $player_id, card_location = 'hand', ontop_of = 0 WHERE card_id = '$card_id'");

        $res = json_encode('noPlayerID');
        $this->DbQuery(
            "UPDATE ingame SET value='$res' WHERE name = 'targetPlayer'"
        );
        $this->notify->all('targetPlayer', '', ['noPlayerID'] );

        //Moved card for all
        $cardNofif = $this->getCollectionFromDB("SELECT * FROM cards WHERE card_id = '$card_id'");
        $players = $this->loadPlayersBasicInfos();
        foreach ($players as $thisPlayer_id => $info) {
            $hiddenCards = $cardNofif;
            foreach ($cardNofif as $index => $card) {
                if ($card['card_owner'] != $thisPlayer_id && $card['card_location'] == 'hand') {
                    $hiddenCards[$index]['card_type'] = 'hidden';
                }
            }
            $this->notify->player($thisPlayer_id,"cardMoved", clienttranslate('Scholar-Effect: ${player_name} took a ${card_name} from the court of ${target_player}'), [
                "cards" => array_values($hiddenCards),
                "player_id" => $player_id,
                "player_name" => $this->getActivePlayerName(),
                "target_player" => $this->getPlayerNameById($targetPlayer),
                "card_name" => $card_name,
                "card_id" => $card_id,
                "i18n" => ['card_name'],
            ]);
        }

        $this->gamestate->nextState("playCard");
    }

    public function actSelectionPriestFirst(int $card_id): void
    {
        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        $data = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'targetPlayer'"
        );
        $targetPlayer = json_decode($data['targetPlayer']['value'], true);
            
        $sql = "SELECT * FROM cards WHERE card_owner = $player_id AND card_location = 'hand'";
        $cards = $this->getCollectionFromDB($sql);

        $data3 = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'blockedCard'"
        );
        $blockedCard = json_decode($data3['blockedCard']['value'], true);

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

        $targetInfluence = $this->cards[$card_name]['influence'];

        //Check if target player would have a valid card to give back
        $sql = "SELECT * FROM cards WHERE card_owner = $targetPlayer AND card_location = 'court'";
        $targetCards = $this->getCollectionFromDB($sql);
        $coveredCards = [];
        foreach ($cards as $card) {
            if ($card['ontop_of'] != 0) {
                $coveredCards[] = $card['ontop_of'];
            }
        }
        $validCardtoGetBack = false;
        foreach ($targetCards as $card) {
            $cardInfluence = $this->cards[$card['card_type']]['influence'];
            if ($cardInfluence < $targetInfluence && !in_array($card['card_id'], $coveredCards) && $card['card_type'] != 'Assassin' && $card['card_type'] != 'Jester' && $card['card_id'] != $blockedCard) {
                $validCardtoGetBack = true;
            }
        }
        if ($validCardtoGetBack == false) {
            throw new \BgaUserException('Target court has no card with lover influence to give back');
        }

        $this->DbQuery("UPDATE cards SET card_owner = $targetPlayer, card_location = 'court', ontop_of = 0 WHERE card_id = '$card_id'");

        //Moved card for all
        $cardNofif = $this->getCollectionFromDB("SELECT * FROM cards WHERE card_id = '$card_id'");
        $players = $this->loadPlayersBasicInfos();
        foreach ($players as $thisPlayer_id => $info) {
            $hiddenCards = $cardNofif;
            foreach ($cardNofif as $index => $card) {
                if ($card['card_owner'] != $thisPlayer_id && $card['card_location'] == 'hand') {
                    $hiddenCards[$index]['card_type'] = 'hidden';
                }
            }
            $this->notify->player($thisPlayer_id,"cardMoved", clienttranslate('Priest-Effect: ${player_name} played a ${card_name} to the court of ${target_player}'), [
                "cards" => array_values($hiddenCards),
                "player_id" => $player_id,
                "player_name" => $this->getActivePlayerName(),
                "target_player" => $this->getPlayerNameById($targetPlayer),
                "card_id" => $card_id,
                "card_name" => $card_name,
                "i18n" => ['card_name'],
            ]);
        }

        $sql2 = "SELECT * FROM cards WHERE card_owner = $targetPlayer AND card_location = 'court'";
        $targetPlayerCards = $this->getCollectionFromDB($sql2);

        $coveredCards = [];

        foreach ($cards as $card) {
            if ($card['ontop_of'] != 0) {
                $coveredCards[] = $card['ontop_of'];
            }
        }

        $validCard = false;
        foreach ($targetPlayerCards as $card) {
            if ($this->cards[$card['card_type']]['influence'] < $targetInfluence && $card['card_type'] != 'Assassin' && $card['card_type'] != 'Jester' && !in_array($card['card_id'], $coveredCards)) {
                $validCard = true;
            }   
        }

        if ($validCard === false) {
            $this->notify->all("logText", clienttranslate('Priest-Effect: There was no valid card in the court of ${target_player}'), [
                "player_name" => $this->getPlayerNameById($player_id),
                "target_player" => $this->getPlayerNameById($targetPlayer),
            ]);

            $res = json_encode('noPlayerID');
            $this->DbQuery(
                "UPDATE ingame SET value='$res' WHERE name = 'targetPlayer'"
            );
            $this->notify->all('targetPlayer', '', ['noPlayerID'] );
    
            $res2 = json_encode(0);
            $this->DbQuery(
                "UPDATE ingame SET value='$res2' WHERE name = 'blockedCard'"
            );
            $this->notify->all('blockedCard', '', [0] );

            $this->gamestate->nextState("pass");
            return;
        }

        $res3 = json_encode($targetInfluence);
        $this->DbQuery(
            "UPDATE ingame SET value='$res3' WHERE name = 'targetInfluence'"
        );
        $this->notify->all('targetInfluence', '', [$targetInfluence] );

        $this->gamestate->nextState("selectionPriestSecond");
    }

    public function actSelectionPriestSecond(int $card_id): void
    {
        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        $data = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'targetInfluence'"
        );
        $targetInfluence = json_decode($data['targetInfluence']['value'], true);

        $data2 = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'targetPlayer'"
        );
        $targetPlayer = json_decode($data2['targetPlayer']['value'], true);
            
        $data3 = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'blockedCard'"
        );
        $blockedCard = json_decode($data3['blockedCard']['value'], true);

        $sql = "SELECT * FROM cards WHERE card_owner = $targetPlayer AND card_location = 'court'";
        $cards = $this->getCollectionFromDB($sql);

        $coveredCards = [];
        foreach ($cards as $card) {
            if ($card['ontop_of'] != 0) {
                $coveredCards[] = $card['ontop_of'];
            }
        }

        // check input values (and find card name)
        $card_name = 'unknown';
        $validCard = false;
        foreach ($cards as $card) {
            if ($card['card_id'] == $card_id && !in_array($card['card_id'], $coveredCards) && $card['card_id'] != $blockedCard) {
                $card_name = $card['card_type'];
                $validCard = true;
            }
        }
        if ($validCard == false) {
            throw new \BgaUserException('Invalid card choice');
        }

        $chosenInfluence = $this->cards[$card_name]['influence'];
        if ($chosenInfluence >= $targetInfluence) {
            throw new \BgaUserException('Choose a card with a lower influence');
        }

        $this->DbQuery("UPDATE cards SET card_owner = $player_id, card_location = 'hand', ontop_of = 0 WHERE card_id = '$card_id'");

        //Moved card for all
        $cardNofif = $this->getCollectionFromDB("SELECT * FROM cards WHERE card_id = '$card_id'");
        $players = $this->loadPlayersBasicInfos();
        foreach ($players as $thisPlayer_id => $info) {
            $hiddenCards = $cardNofif;
            foreach ($cardNofif as $index => $card) {
                if ($card['card_owner'] != $thisPlayer_id && $card['card_location'] == 'hand') {
                    $hiddenCards[$index]['card_type'] = 'hidden';
                }
            }
            $this->notify->player($thisPlayer_id,"cardMoved", clienttranslate('Priest-Effect: ${player_name} took a ${card_name} from the court of ${target_player}'), [
                "cards" => array_values($hiddenCards),
                "player_id" => $player_id,
                "player_name" => $this->getActivePlayerName(),
                "target_player" => $this->getPlayerNameById($targetPlayer),
                "card_id" => $card_id,
                "card_name" => $card_name,
                "i18n" => ['card_name'],
            ]);
        }

        $res = json_encode('noPlayerID');
        $this->DbQuery(
            "UPDATE ingame SET value='$res' WHERE name = 'targetPlayer'"
        );
        $this->notify->all('targetPlayer', '', ['noPlayerID'] );

        $res2 = json_encode(0);
        $this->DbQuery(
            "UPDATE ingame SET value='$res2' WHERE name = 'targetInfluence'"
        );
        $this->notify->all('targetInfluence', '', [0] );

        $res3 = json_encode(0);
        $this->DbQuery(
            "UPDATE ingame SET value='$res3' WHERE name = 'blockedCard'"
        );
        $this->notify->all('blockedCard', '', [0] );

        $this->gamestate->nextState("playCard");
    }

    public function actPassPriest (): void
    {
        $res = json_encode('noPlayerID');
        $this->DbQuery(
            "UPDATE ingame SET value='$res' WHERE name = 'targetPlayer'"
        );
        $this->notify->all('targetPlayer', '', ['noPlayerID'] );

        $res2 = json_encode(0);
        $this->DbQuery(
            "UPDATE ingame SET value='$res2' WHERE name = 'blockedCard'"
        );
        $this->notify->all('blockedCard', '', [0] );

        $this->gamestate->nextState("pass");
    }

    public function updateScores (): void
    {
        $sql = "SELECT * FROM cards";
        $cards = $this->getCollectionFromDB($sql);

        $coveredCards = [];
        foreach ($cards as $card) {
            if ($card['ontop_of'] != 0) {
                $coveredCards[] = $card['ontop_of'];
            }
        }

        $players = $this->loadPlayersBasicInfos();
        foreach ($players as $thisPlayer_id => $info) {
            $playerInfluence = 0;
            $jesterAmound = 0;
            $ownPrincess = false;
            foreach ($cards as $card) {
                if ($card['card_owner'] == $thisPlayer_id && $card['card_location'] == 'court' && !in_array($card['card_id'], $coveredCards)) {
                    $playerInfluence = $playerInfluence + $this->cards[$card['card_type']]['influence'];
                    if ($card['card_type'] == 'Jester' ) {
                        $jesterAmound = $jesterAmound + 1;
                    }
                    if ($card['card_type'] == 'Princess' ) {
                        $ownPrincess = true;
                    }
                }
            }
            if ($jesterAmound === 3) {
                $playerInfluence = 0;
            }
            if ($ownPrincess === true) {
                $this->DbQuery( "UPDATE player SET player_score_aux=1 WHERE player_id='$thisPlayer_id'" );
            } else {
                $this->DbQuery( "UPDATE player SET player_score_aux=0 WHERE player_id='$thisPlayer_id'" );
            }
            $this->DbQuery( "UPDATE player SET player_score=$playerInfluence WHERE player_id='$thisPlayer_id'" );
            $this->notify->all("score", '', [
                "player_id" => $thisPlayer_id,
                "player_score" => $playerInfluence,
            ]);
        }
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
        $easyMode = $this->tableOptions->get(101);
        
        // Determine card distribution based on player count
        if ($playerCount == 2) {
            $cardsPerPlayer = 8;
        } else { // 3 or 4 players
            $cardsPerPlayer = 7;
        }
        if ($easyMode == 2) {
            $cardsPerPlayer = $cardsPerPlayer -1;
        }
        $asideCards = count($cards) - ($cardsPerPlayer*$playerCount);

        // Split cards into player cards and aside cards
        $playerCards = array_slice($cards, 0, $cardsPerPlayer * $playerCount);
        $asideCards = array_slice($cards, $cardsPerPlayer * $playerCount, $asideCards);

        // Distribute player cards
        $playerIndex = 0;
        foreach ($players as $playerId => $player) {
            $playerCardsChunk = array_slice($playerCards, $playerIndex * $cardsPerPlayer, $cardsPerPlayer);
            foreach ($playerCardsChunk as $card) {
                $this->DbQuery("UPDATE cards SET card_location = 'hand', card_owner = '$playerId', ontop_of = 0 WHERE card_id = '{$card['card_id']}'");
            }
            $playerIndex++;
        }

        // Set aside cards
        foreach ($asideCards as $card) {
            $this->DbQuery("UPDATE cards SET card_location = 'aside', card_owner = 'noPlayerID', ontop_of = 0  WHERE card_id = '{$card['card_id']}'");
        }

        $allCards = $this->getCollectionFromDB("SELECT * FROM cards");
        foreach ($players as $playerId => $player) {
            $hiddenCards = $allCards;
            foreach ($allCards as $index => $card) {
                if ($card['card_owner'] != $playerId && $card['card_location'] == 'hand'){
                    $hiddenCards[$index]['card_type'] = 'hidden';
                }
            }
            $this->notify->player($playerId, 'cardMoved', '', [
                "cards" => array_values($hiddenCards),
            ]);
        }


        $data = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'currentRound'"
        );
        $currentRound = json_decode($data['currentRound']['value'], true);
        $this->notify->all("logText", clienttranslate('Round ${round} has started'), [
            "round" => $currentRound,
        ]);

        $this->gamestate->nextState("nextPlayer");
    } 

    public function stNextPlayer(): void {
        //Update Scores
        $this->updateScores();

        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        // Give some extra time to the active player when he completed an action
        $this->giveExtraTime($player_id);
        
        $this->activeNextPlayer();

        // Check if new player still has cards
        $sql2 = "SELECT * FROM cards WHERE card_location = 'hand'";
        $handCards = $this->getCollectionFromDB($sql2);
        $emptyHand = true;
        $playersSkipped = 0;
        $playersAmound = $this->getPlayersNumber();
        while ($emptyHand === true) {
            $new_player_id = (int)$this->getActivePlayerId();
            foreach ($handCards as $card) {
                if ($card['card_owner'] == $new_player_id) {
                    $emptyHand = false;
                    break 2;
                }
            }
            $playersSkipped = $playersSkipped + 1;
            if ($playersAmound === $playersSkipped) {
                // Finish Round!!!
                $this->gamestate->nextState("finishRound");
                return;
            }
            $this->activeNextPlayer();
        }

        // Go to another gamestate
        // Here, we would detect if the game is over, and in this case use "endGame" transition instead 
        $this->gamestate->nextState("nextPlayer");
    }

    public function stActivatePlayer(): void {
        $data = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'specialActivePlayer'"
        );
        $specialActivePlayer = json_decode($data['specialActivePlayer']['value'], true);

        // Give some extra time to the active player when he completed an action
        $this->giveExtraTime($specialActivePlayer);
        
        $this->gamestate->changeActivePlayer( $specialActivePlayer );

        // Go to another gamestate
        $this->gamestate->nextState("selectionTraderOpponent");
    }

    public function stBackToPreviousPlayer(): void {
        $data = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'targetPlayer'"
        );
        $targetPlayer = json_decode($data['targetPlayer']['value'], true);

        $res = json_encode('noPlayerID');
        $this->DbQuery(
            "UPDATE ingame SET value='$res' WHERE name = 'targetPlayer'"
        );
        $this->notify->all('targetPlayer', '', ['noPlayerID'] );

        $res = json_encode('noPlayerID');
        $this->DbQuery(
            "UPDATE ingame SET value='$res' WHERE name = 'specialActivePlayer'"
        );
        $this->notify->all('specialActivePlayer', '', ['noPlayerID'] );

        $res = json_encode(0);
        $this->DbQuery(
            "UPDATE ingame SET value='$res' WHERE name = 'targetInfluence'"
        );
        $this->notify->all('targetInfluence', '', [0] );

        $res4 = json_encode(0);
        $this->DbQuery(
            "UPDATE ingame SET value='$res4' WHERE name = 'blockedCard'"
        );
        $this->notify->all('blockedCard', '', [0] );

        $this->gamestate->changeActivePlayer( $targetPlayer );

        // Go to another gamestate
        $this->gamestate->nextState("nextPlayer");
    }

    public function stFinishRound(): void {
        $roundsMode = $this->tableOptions->get(100);

        $scoresTotal = [];
        $scoreHighest = 0;
        $players = $this->loadPlayersBasicInfos();
        $winnerByPoints = false;
        $winnersRound = [];
        $mostWins = 0;
        $allBeforeScores = $this->getCollectionFromDB( "SELECT player_id id, player_score score, player_score_aux tiebreaker,rounds_before_points rounds_before_points, rounds_won rounds_won FROM player" );

        foreach($players as $thisPlayerId => $value) {
            $currentScore = (int) $allBeforeScores[$thisPlayerId]['score'];

            //Find Round Winners
            if ($scoreHighest < $currentScore) {
                $scoreHighest = $currentScore;
                $winnersRound = [];
                $winnersRound[] = $thisPlayerId;
            }
            if ($scoreHighest === $currentScore) {
                if ($allBeforeScores[$winnersRound[0]]['tiebreaker'] < $allBeforeScores[$thisPlayerId]['tiebreaker']) {
                    $winnersRound = [];
                    $winnersRound[] = $thisPlayerId;
                }
                if ($allBeforeScores[$winnersRound[0]]['tiebreaker'] = $allBeforeScores[$thisPlayerId]['tiebreaker']) {
                    $winnersRound[] = $thisPlayerId;
                }
            }

            //Manage Points
            $scoresTotal[$thisPlayerId] = (int) $currentScore;
            $pointsBefore = (int) $allBeforeScores[$thisPlayerId]['rounds_before_points'];
            $pointsTotal = $currentScore + $pointsBefore;
            if ($pointsTotal > 41) {
                $winnerByPoints = true;
            }
            $scoresTotal[$thisPlayerId] = $pointsTotal;
            $this->DbQuery( "UPDATE player SET rounds_before_points=$pointsTotal WHERE player_id='$thisPlayerId'" );
        }

        foreach ($winnersRound as $winnerID) {
            $rounds_won = $allBeforeScores[$thisPlayerId]['rounds_won'] + 1;
            $this->DbQuery( "UPDATE player SET rounds_won = $rounds_won WHERE player_id='$winnerID'" );
            if ($mostWins < $rounds_won) {
                $mostWins = $rounds_won;
            }
        }

        //Handle Game Modes and Transitions
        if ($roundsMode === 1) {
            $this->gamestate->nextState("endGame");
        }

        if ($roundsMode === 2) {
            //End game or restart round
            if ($winnerByPoints === true) {
                foreach($players as $thisPlayerId => $value) {
                    $this->DbQuery( "UPDATE player SET player_score=$scoresTotal[$thisPlayerId] WHERE player_id='$thisPlayerId'" );
                }
                
                $this->gamestate->nextState("endGame");
            } else {
                $this->gamestate->nextState("resetRound");
            }
        }

        if ($roundsMode === 3 || $roundsMode === 4) {
            if ($roundsMode === 3) {
                $targetRoundWins = 2;
            } else {
                $targetRoundWins = 3;
            }

            if ($mostWins === $targetRoundWins) {
                $allRoundsWon = $this->getCollectionFromDB( "SELECT rounds_won rounds_won FROM player" );


                foreach($players as $thisPlayerId => $value) {
                    $playerRoundsWon = $allRoundsWon[$thisPlayerId]['rounds_won'];
                    $this->DbQuery( "UPDATE player SET player_score=$playerRoundsWon, player_score_aux=0 WHERE player_id='$thisPlayerId'" );
                }

                $this->gamestate->nextState("endGame");
            } else {
                $this->gamestate->nextState("resetRound");
            }

        }
    }

    public function stResetRound(): void {
        //Reset Scores
        $players = $this->loadPlayersBasicInfos();
        foreach($players as $player_id => $value) {
            $this->DbQuery( "UPDATE player SET player_score=0 WHERE player_id='$player_id'" );
            $this->DbQuery( "UPDATE player SET player_score_aux=0 WHERE player_id='$player_id'" );
            $this->notify->all("score", '', [
                "player_id" => $player_id,
                "player_score" => 0,
            ]);
        }

        //Reset Cards
        $this->DbQuery("UPDATE cards SET card_location = 'aside', card_owner = 'noPlayerID', ontop_of = 0");
        $sql = "SELECT * FROM cards";
        $cards = $this->getCollectionFromDB($sql);
        $this->notify->all( 'cardMoved', '', [
            "cards" => array_values($cards),
        ]);

        //Update Rounds
        $data = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'currentRound'"
        );
        $currentRound = json_decode($data['currentRound']['value'], true);

        $allScores = $this->getCollectionFromDB( "SELECT player_id id, rounds_before_points rounds_before_points, rounds_won rounds_won FROM player" );
        $this->notify->all("newRound", '', [
            "currentRound" => $currentRound,
            "scores" => $allScores,
        ]);

        $updatedRound = $currentRound +1;
        $res = json_encode($updatedRound);
        $this->DbQuery(
            "UPDATE ingame SET value='$res' WHERE name = 'currentRound'"
        );

        $this->gamestate->nextState("dealCards");
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
            "SELECT `player_id` `id`, `player_score` `score`, `rounds_before_points` `rounds_before_points`, `rounds_won` `rounds_won` FROM `player`"
        );

        // TODO: Gather all information about current game situation (visible by player $current_player_id).

        $data = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'targetPlayer'"
        );
        $targetPlayer = json_decode($data['targetPlayer']['value'], true);
        $result['targetPlayer'] = $targetPlayer;

        $data2 = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'specialActivePlayer'"
        );
        $specialActivePlayer = json_decode($data2['specialActivePlayer']['value'], true);
        $result['specialActivePlayer'] = $specialActivePlayer;

        $data3 = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'targetInfluence'"
        );
        $targetInfluence = json_decode($data3['targetInfluence']['value'], true);
        $result['targetInfluence'] = $targetInfluence;

        $data4 = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'blockedCard'"
        );
        $blockedCard = json_decode($data4['blockedCard']['value'], true);
        $result['blockedCard'] = $blockedCard;

        $gamestate = $this->gamestate->state();

        $allCards = $this->getCollectionFromDB("SELECT * FROM cards");

        $amountOfPlayers = $this->getPlayersNumber();
        $easyMode = $this->tableOptions->get(101);
        $cardsInPlay = [];
        foreach($this->cards as $name => $card) {
            $amountCard = $card['amount2Players'];
            if ($amountOfPlayers == 3) {
                $amountCard = $card['amount3Players'];
            }
            if ($amountOfPlayers == 4) {
                $amountCard = $card['amount4Players'];
            }
            if ($easyMode == 2 && $card['beginner'] == false) {
                $amountCard = 0;
            } else {
                $cardsInPlay[] = [$name => $amountCard];
            }
        }
        // Determine card distribution based on player count
        if ($amountOfPlayers == 2) {
            $cardsPerPlayer = 8;
        } else { // 3 or 4 players
            $cardsPerPlayer = 7;
        }
        if ($easyMode == 2) {
            $cardsPerPlayer = $cardsPerPlayer -1;
        }
        $asideCards = count($allCards) - ($cardsPerPlayer*$amountOfPlayers);
        $cardsInPlay[] = ['aside' => $asideCards];
        $result['cardsInPlay'] = $cardsInPlay;

        $hiddenCards = $allCards;
        foreach ($allCards as $index => $card) {
            if ($gamestate['name'] == 'selectionKnight') {
                if ($card['card_owner'] != $current_player_id && $card['card_owner'] != $targetPlayer && $card['card_location'] == 'hand') {
                    $hiddenCards[$index]['card_type'] = 'hidden';
                }
            } else {
                if ($card['card_owner'] != $current_player_id && $card['card_location'] == 'hand') {
                    $hiddenCards[$index]['card_type'] = 'hidden';
                }
            }
        }
        $result['cards'] = array_values($hiddenCards);

        $roundsMode = $this->tableOptions->get(100);
        $result['roundsMode'] = $roundsMode;

        $data = $this->getCollectionFromDb(
            "SELECT * FROM ingame WHERE name = 'currentRound'"
        );
        $result['currentRound'] = json_decode($data['currentRound']['value'], true);

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

        // Create empty 'currentRound'-Entry
        $sql = "INSERT INTO ingame (name, value) VALUES ('currentRound', 1)";
        $this->DbQuery($sql);
        // Create empty 'targetPlayer'-Entry
        $sql = "INSERT INTO ingame (name, value) VALUES ('targetPlayer', 'noPlayerID')";
        $this->DbQuery($sql);
        // Create empty 'specialActivePlayer'-Entry
        $sql = "INSERT INTO ingame (name, value) VALUES ('specialActivePlayer', 'noPlayerID')";
        $this->DbQuery($sql);
        // Create empty 'targetInfluence'-Entry
        $sql = "INSERT INTO ingame (name, value) VALUES ('targetInfluence', 0)";
        $this->DbQuery($sql);
        // Create empty 'blockedCard'-Entry
        $sql = "INSERT INTO ingame (name, value) VALUES ('blockedCard', 0)";
        $this->DbQuery($sql);

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


        $amountOfPlayers = count($players);
        $easyMode = $this->tableOptions->get(101);

        //Create Cards List
        $allCards = [];
        foreach($this->cards as $name => $card) {
            $amountCard = $card['amount2Players'];
            if ($amountOfPlayers == 3) {
                $amountCard = $card['amount3Players'];
            }
            if ($amountOfPlayers == 4) {
                $amountCard = $card['amount4Players'];
            }
            if ($easyMode == 2 && $card['beginner'] == false) {
                $amountCard = 0;
            }
            $index = 0;
            while ($index < $amountCard) {
                $allCards[] = $name;
                $index = $index +1;
            }
        }
        shuffle($allCards);

        //Create Cards in Database
        $randomArray = array();
        foreach($allCards as $cardname) {
            $numFound = false;
            $num = 0;
            while ($numFound === false) {
                $num = bga_rand(1, 1000);
                if (!in_array($num, $randomArray)) {
                    $randomArray[] = $num;
                    $numFound = true;
                }
            }
            $numString = "" . $num;
            $this->DbQuery("INSERT INTO cards (card_id, card_type, card_location, card_owner, ontop_of) 
                VALUES ('$numString', '$cardname', 'hand', 'noPlayerID', 0)");
        }

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
