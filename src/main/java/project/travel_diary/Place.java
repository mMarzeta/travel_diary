package project.travel_diary;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import java.util.Date;

/**
 * Created by maciejmarzeta on 17.05.2018.
 */

@Data
@Entity
public class Place {
    private @Id @GeneratedValue Long id;
    private Double x_cord;
    private Double y_cord;
    private String description;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date date_from;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date date_to;

    private Place() {}


    public Place(Double x_cord, Double y_cord, String description, Date date_from, Date date_to) {
        this.x_cord = x_cord;
        this.y_cord = y_cord;
        this.description = description;
        this.date_from = date_from;
        this.date_to = date_to;
    }
}
