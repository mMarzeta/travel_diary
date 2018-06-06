package project.travel_diary;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Created by maciejmarzeta on 17.05.2018.
 */

@Controller
public class HomeController {

    @RequestMapping(value = "/")
    public String index(){
        return "index";
    }
}
