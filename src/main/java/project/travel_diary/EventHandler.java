package project.travel_diary;

import static project.travel_diary.WebSocketConfiguration.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.core.annotation.HandleAfterCreate;
import org.springframework.data.rest.core.annotation.HandleAfterDelete;
import org.springframework.data.rest.core.annotation.HandleAfterSave;
import org.springframework.data.rest.core.annotation.RepositoryEventHandler;
import org.springframework.hateoas.EntityLinks;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Created by maciejmarzeta on 25.08.2018.
 */
@Component
@RepositoryEventHandler(Place.class)
public class EventHandler {

    private final SimpMessagingTemplate websocket;

    private final EntityLinks entityLinks;

    @Autowired
    public EventHandler(SimpMessagingTemplate websocket, EntityLinks entityLinks) {
        this.websocket = websocket;
        this.entityLinks = entityLinks;
    }

    @HandleAfterCreate
    public void newPlace(Place place) {
        this.websocket.convertAndSend(
                MESSAGE_PREFIX + "/newPlace", getPath(place));
    }

    @HandleAfterDelete
    public void deletePlace(Place place) {
        this.websocket.convertAndSend(
                MESSAGE_PREFIX + "/deletePlace", getPath(place));
    }

    @HandleAfterSave
    public void updatePlace(Place place) {
        this.websocket.convertAndSend(
                MESSAGE_PREFIX + "/updatePlace", getPath(place));
    }

    private String getPath(Place place) {
        return this.entityLinks.linkForSingleResource(place.getClass(),
                place.getId()).toUri().getPath();
    }

}
