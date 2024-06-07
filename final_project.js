import {defs, tiny} from './examples/common.js';
import {Text_Line} from './examples/text-demo.js';
//import {Texture} from "./tiny-graphics";
//import {Texture} from './tiny-graphics';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs

export class Final_Project extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            // TODO:  Fill in as many additional shape instances as needed in this key/value table.
            //        (Requirement 1)
            p3_ring: new defs.Torus(50, 50),
            sun: new defs.Subdivision_Sphere(4),
            planet1: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            planet2: new defs.Subdivision_Sphere(2),
            planet3: new defs.Subdivision_Sphere(3),
            planet4: new defs.Subdivision_Sphere(4),
            moon: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(1),
            obstacle: new defs.Rounded_Capped_Cylinder(15, 15,  [[0, 15], [0, 15]]),
            cube: new defs.Cube(),
            cone: new defs.Closed_Cone(15,15,[[0,15],[0,15]]),
            text: new Text_Line(40),
        };

        this.images = {
            grass: "assets/grass_texture.png",
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0, specularity: 0, color: hex_color("#ffffff")}),
            test2: new Material(new Gouraud_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#992828")}),
            ring: new Material(new Ring_Shader(),
                {ambient: 1, diffusivity: 1, color: hex_color('#b08040'), specularity: 1}),
            // TODO:  Fill in as many additional material objects as needed in this key/value table.
            //        (Requirement 4)

            sun_shader: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 1, color: hex_color('#FFD700')}),
            cloud_shader: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 1, color: hex_color('#FFFFFF')}),

            grass_shader: new Material(new Textured_Phong(),
                {color: hex_color('#000000'),
                    ambient: 1, diffusivity: 0.1, specularity: 0.1,
                    texture: new Texture(this.images.grass),}),
            obstacle_shader: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0, color: hex_color('#ADD8E6')}),
            text_image: new Material(new defs.Textured_Phong(1), {
                ambient: 1, diffusivity: 0, specularity: 0,
                texture: new Texture("assets/text.png"),
            }),
        }

        this.shapes.cube.arrays.texture_coord = this.shapes.cube.arrays.texture_coord.map(x => x.times(80));
        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.period_denominator = 5;
        this.lives = 3;
        this.score = 0;
        this.y_angle = 0;
        this.x_angle = 0;
        this.start = false;
        this.up = false
        this.down = false;
        this.left = false;
        this.right = false;
        this.start_time = 0;
        this.game_active = true;
        this.arrow_speed = -7;
        this.shield_1_x = Math.floor(Math.random() * (6 + 1)) - 3;
        this.shield_1_y = Math.floor(Math.random() * (5 + 1)) - 3;
        this.shield_1_z = Math.floor(Math.random() * (15 + 1)) - 15;
        this.life_x = Math.floor(Math.random() * (6 + 1)) - 3;
        this.life_y = Math.floor(Math.random() * (5 + 1)) - 3;
        this.life_z = Math.floor(Math.random() * (15 + 1)) - 15;
        this.show_shield_block = true;
        this.show_life_block = true;
        this.shield_active = false;
        this.game_active = true;
        this.justDied = false;
    }



    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Shoot Arrow", ["c"], () => this.start = () => true);
        this.key_triggered_button("Move Arrow Up", ["i"], () => this.up = () => true);
        this.key_triggered_button("Move Arrow Down", ["k"], () => this.down = () => true);
        this.key_triggered_button("Move Arrow Left", ["j"], () => this.left = () => true);
        this.key_triggered_button("Move Arrow Right", ["l"], () => this.right = () => true);
        this.key_triggered_button("Restart After Game Over", ["b"], () => this.game_active = true);
        this.new_line();
    }



    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }
        let model_transform = Mat4.identity();
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const reset_game = () =>
        {
            this.start = false;
            program_state.set_camera(this.initial_camera_location);
            this.y_angle = 0;
            this.x_angle = 0;
            this.shield_1_x = Math.floor(Math.random() * (6 + 1)) - 3;
            this.shield_1_y = Math.floor(Math.random() * (5 + 1)) - 3;
            this.shield_1_z = Math.floor(Math.random() * (15 + 1)) - 15;
            this.life_x = Math.floor(Math.random() * (6 + 1)) - 3;
            this.life_y = Math.floor(Math.random() * (5 + 1)) - 3;
            this.life_z = Math.floor(Math.random() * (15 + 1)) - 15;
            this.show_life_block = true;
            this.show_shield_block = true;
            this.shield_active = false;
            //if(this.lives === 0)
            //{
            //console.log("dead");
            //this.game_active = false;
            //}
        };

        const draw_cloud = (axis_transform) =>
        {//sun_matrix.times(Mat4.translation(5,-1,-2))
            this.shapes.cube.draw(context,program_state, axis_transform, this.materials.cloud_shader);
            this.shapes.cube.draw(context,program_state, axis_transform.times(Mat4.translation(-1.6,-0.4,0)).times(Mat4.scale(0.6,0.6,1)), this.materials.cloud_shader);
            this.shapes.cube.draw(context,program_state, axis_transform.times(Mat4.translation(1.6,-0.4,0)).times(Mat4.scale(0.6,0.6,1)), this.materials.cloud_shader);
        };

        const hit_life = () =>
        {
            this.show_life_block = false;
            this.lives++;
        };

        const hit_shield = () =>
        {
            this.show_shield_block = false;
            this.shield_active = true;
        };


        // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 3 and 4)

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        const period = 10;
        const max_scale = 3;
        const min_scale = 1;
        const scale_offset = (max_scale + min_scale) / 2;
        const radius =  scale_offset + Math.sin(((2*Math.PI)/period) * t);

        // TODO: Lighting (Requirement 2)
        const light_position = vec4(5, 5, 9999999, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, hex_color("ffffff"), 10**radius)];


        //arrow
        let arrow_transform = model_transform;
        if(this.game_active){
            if(this.lives === 0)
            {
                this.lives = 3;
                this.score = 0;
                reset_game();
                this.period_denominator = 5;
                //comment
            }
            if(this.start)
            {
                if(this.up)
                {
                    this.x_angle += Math.PI/180;
                    this.up = false;
                }
                if(this.down)
                {
                    this.x_angle -= Math.PI/180;
                    this.down = false;
                }
                if(this.left)
                {
                    this.y_angle += Math.PI/180;
                    this.left = false;
                }
                if(this.right)
                {
                    this.y_angle -= Math.PI/180;
                    this.right = false;
                }
                if(this.x_angle >= Math.PI/2)
                {
                    arrow_transform = arrow_transform.times(Mat4.translation(0,-3*(t- this.start_time),0)).times(Mat4.rotation(this.y_angle, 0, 1, 0)).times(Mat4.rotation(this.x_angle, 1, 0, 0))
                }
                else
                {
                    arrow_transform = arrow_transform.times(Mat4.translation(0,-3*(t- this.start_time),0)).times(Mat4.rotation(this.y_angle, 0, 1, 0)).times(Mat4.rotation(this.x_angle, 1, 0, 0)).times(Mat4.translation(0, 0, this.arrow_speed*(t- this.start_time)));
                }
                //arrow_transform = arrow_transform.times(Mat4.translation(0,-4*(t- this.start_time),0)).times(Mat4.rotation(this.y_angle, 0, 1, 0)).times(Mat4.rotation(this.x_angle, 1, 0, 0)).times(Mat4.translation(0, 0, -4*(t- this.start_time)));
                let camera_position = Mat4.inverse(arrow_transform.times(Mat4.translation(0,5,20)).times(Mat4.rotation(-Math.PI/10,1, 0, 0)));
                program_state.set_camera(camera_position);
            }
            else {
                this.start_time = t;
            }
            let arrow_tip_coord = arrow_transform.times([[0],[-2],[1.2],[1]]);
            let arrow_setback1 = arrow_transform.times([[0],[-2],[2.4],[1]]);
            let arrow_setback2 = arrow_transform.times([[0],[-2],[3.5],[1]]);
            let arrow_setback3 = arrow_transform.times([[0],[-2],[4.6],[1]]);
            let arrow_setback4 = arrow_transform.times([[0],[-2],[5.72],[1]]);
            let arrow_setback5 = arrow_transform.times([[0],[-2],[6.85],[1]]);
            let arrow_endpoint_coord = arrow_transform.times([[0],[-2],[8],[1]])
            let arrow_points = [arrow_tip_coord, arrow_setback1, arrow_setback2, arrow_setback3, arrow_setback4, arrow_setback5, arrow_endpoint_coord];

            //this.shapes.sun.draw(context,program_state, model_transform.times(Mat4.translation(0,-2,-0.4)).times(Mat4.scale(0.5,0.5,0.5)), this.materials.sun_shader);
            if(arrow_tip_coord[1][0] <= -9.8 || arrow_endpoint_coord [1][0] <= -9.8)
            {
                console.log("Hit ground");
                reset_game();
                this.lives--;
                if(this.lives === 0)
                {
                    this.game_active = false;
                }
            }
            let arrow_cone_transform = arrow_transform.times(Mat4.translation(0, -2, 2)).times(Mat4.scale(0.2, 0.2, 0.8)).times(Mat4.rotation(Math.PI, 1, 0, 0));
            let arrow_body_transform = arrow_transform.times(Mat4.translation(0, -2, 5)).times(Mat4.scale(0.1, 0.1, 6));
            this.shapes.cone.draw(context,program_state, arrow_cone_transform, this.materials.sun_shader.override({color: hex_color("#B2B4B6")}));
            this.shapes.obstacle.draw(context,program_state, arrow_body_transform , this.materials.sun_shader.override({color: hex_color("#964B00")}));

            //sun and clouds
            const sun_matrix = model_transform.times(Mat4.translation(-53,27,-85).times(Mat4.scale(15,15,10)));
            //this.shapes.obstacle.draw(context,program_state, model_transform , this.materials.sun_shader.override({color: hex_color("#964B00")}));
            this.shapes.sun.draw(context,program_state, sun_matrix, this.materials.sun_shader);
            draw_cloud(model_transform.times(Mat4.translation(0,22,-50)).times(Mat4.translation(40*Math.cos((Math.PI/15)*t),2,-7)).times(Mat4.scale(5,5,4)));
            draw_cloud(model_transform.times(Mat4.translation(0,22,-60)).times(Mat4.translation(-40*Math.cos((Math.PI/15)*t),1,-7)).times(Mat4.scale(5,5,4)));


            //target
            this.shapes.sun.draw(context,program_state, (model_transform.times(Mat4.translation(0,0,-24.991)).times(Mat4.scale(1,1,0))), this.materials.obstacle_shader.override({color: hex_color("ff0000")}))
            this.shapes.sun.draw(context, program_state, (model_transform.times(Mat4.translation(0,0,-24.994)).times(Mat4.scale(3,3,0))), this.materials.obstacle_shader.override({color: hex_color("00ff00")}));
            this.shapes.sun.draw(context, program_state, (model_transform.times(Mat4.translation(0,0,-24.997))).times(Mat4.scale(5,5,0)), this.materials.obstacle_shader.override({color: hex_color("0000ff")}));
            this.shapes.sun.draw(context, program_state, (model_transform.times(Mat4.translation(0,0,-25))).times(Mat4.scale(7,7,0)), this.materials.obstacle_shader.override({color: hex_color("000000")}));
            //center (0,0,-25)
            let distance_btwn_tip_center = Math.sqrt(Math.pow(0 - arrow_tip_coord[0][0], 2) + Math.pow(0 - arrow_tip_coord[1][0], 2));
            if(distance_btwn_tip_center <= 7 && arrow_tip_coord[2][0] <= -26) {
                console.log("Hit target");
                this.score++;
                if(distance_btwn_tip_center <= 5 )
                {
                    this.score++;
                    if(distance_btwn_tip_center <= 3)
                    {
                        this.score++;
                        if(distance_btwn_tip_center <= 1)
                        {
                            this.score++;
                        }
                    }
                }
                if(this.period_denominator > 1)
                {
                    this.period_denominator -= 1;
                }
                this.arrow_speed--;
                reset_game();
            }
            else if(arrow_tip_coord[2][0] <= -26)
            {
                this.lives--;
                reset_game();
                if(this.lives === 0)
                {
                    this.game_active = false;
                }

            }

            //grass
            //this.shapes.cube.draw(context, program_state,model_transform.times(Mat4.translation(0,-10,6)).times(Mat4.scale(100,1,37)), this.materials.obstacle_shader.override({color: hex_color("04Af70")}));
            let grass_transform = model_transform.times(Mat4.translation(0,-10,6)).times(Mat4.scale(100,1,37));
            //console.log(grass_transform);
            //this.shapes.cube.draw(context, program_state,model_transform.times(Mat4.translation(0,-9.5,0)), this.materials.sun_shader);
            this.shapes.cube.draw(context, program_state,grass_transform, this.materials.grass_shader);

            //Power-Ups and Shield
            let cube_scale = 1;
            let shield_1_transform = model_transform.times(Mat4.translation(this.shield_1_x, this.shield_1_y, this.shield_1_z)).times(Mat4.scale(cube_scale, cube_scale, cube_scale));
            let life_up_transform = model_transform.times(Mat4.translation(this.life_x, this.life_y, this.life_z)).times(Mat4.scale(cube_scale, cube_scale, cube_scale));

            //console.log(this.shield_1_x);
            //console.log(arrow_points[0][1][0]);
            //console.log(arrow_points[0][2][0]);
            //console.log(this.shield_1_z - cube_scale);
            //console.log(this.shield_1_x);
            //console.log((this.shield_1_x - (cube_scale)) + " <= " + arrow_points[0][0][0] + " <= " + (this.shield_1_x + (cube_scale)));
            //console.log((this.shield_1_y - cube_scale) + " <= " + arrow_points[0][1][0] + " <= " + (this.shield_1_y + cube_scale));
            //console.log((this.shield_1_z - cube_scale) + " <= " + arrow_points[0][2][0] + " <= " + (this.shield_1_z + cube_scale));
            if(this.show_shield_block) {
                if ((this.shield_1_x - cube_scale) <= arrow_points[0][0][0] && arrow_points[0][0][0] <= (this.shield_1_x + cube_scale)) {
                    //console.log("tip align x");
                    if ((this.shield_1_y - cube_scale) <= arrow_points[0][1][0] && arrow_points[0][1][0] <= (this.shield_1_y + cube_scale)) {
                        //console.log("tip align y");
                        if ((this.shield_1_z - cube_scale) <= arrow_points[0][2][0] && arrow_points[0][2][0] <= (this.shield_1_z + cube_scale)) {
                            console.log("Shield up hit");
                            hit_shield();
                        }
                    }
                }

                if (this.shield_1_x - cube_scale <= arrow_points[1][0][0] && arrow_points[1][0][0] <= this.shield_1_x + cube_scale) {
                    if (this.shield_1_y - cube_scale <= arrow_points[1][1][0] && arrow_points[1][1][0] <= this.shield_1_y + cube_scale) {
                        if (this.shield_1_z - cube_scale <= arrow_points[1][2][0] && arrow_points[1][2][0] <= this.shield_1_z + cube_scale) {
                            console.log("Shield up hit");
                            hit_shield();
                        }
                    }
                }

                if (this.shield_1_x - cube_scale <= arrow_points[2][0][0] && arrow_points[2][0][0] <= this.shield_1_x + cube_scale) {
                    if (this.shield_1_y - cube_scale <= arrow_points[2][1][0] && arrow_points[2][1][0] <= this.shield_1_y + cube_scale) {
                        if (this.shield_1_z - cube_scale <= arrow_points[2][2][0] && arrow_points[2][2][0] <= this.shield_1_z + cube_scale) {
                            console.log("Shield up hit");
                            hit_shield();
                        }
                    }
                }

                if (this.shield_1_x - cube_scale <= arrow_points[3][0][0] && arrow_points[3][0][0] <= this.shield_1_x + cube_scale) {
                    if (this.shield_1_y - cube_scale <= arrow_points[3][1][0] && arrow_points[3][1][0] <= this.shield_1_y + cube_scale) {
                        if (this.shield_1_z - cube_scale <= arrow_points[3][2][0] && arrow_points[3][2][0] <= this.shield_1_z + cube_scale) {
                            console.log("Shield up hit");
                            hit_shield();
                        }
                    }
                }

                if (this.shield_1_x - cube_scale <= arrow_points[4][0][0] && arrow_points[4][0][0] <= this.shield_1_x + cube_scale) {
                    if (this.shield_1_y - cube_scale <= arrow_points[4][1][0] && arrow_points[4][1][0] <= this.shield_1_y + cube_scale) {
                        if (this.shield_1_z - cube_scale <= arrow_points[4][2][0] && arrow_points[4][2][0] <= this.shield_1_z + cube_scale) {
                            console.log("Shield up hit");
                            hit_shield();
                        }
                    }
                }

                if (this.shield_1_x - cube_scale <= arrow_points[5][0][0] && arrow_points[5][0][0] <= this.shield_1_x + cube_scale) {
                    if (this.shield_1_y - cube_scale <= arrow_points[5][1][0] && arrow_points[5][1][0] <= this.shield_1_y + cube_scale) {
                        if (this.shield_1_z - cube_scale <= arrow_points[5][2][0] && arrow_points[5][2][0] <= this.shield_1_z + cube_scale) {
                            console.log("Shield up hit");
                            hit_shield();
                        }
                    }
                }

                if (this.shield_1_x - cube_scale <= arrow_points[6][0][0] && arrow_points[6][0][0] <= this.shield_1_x + cube_scale) {
                    if (this.shield_1_y - cube_scale <= arrow_points[6][1][0] && arrow_points[6][1][0] <= this.shield_1_y + cube_scale) {
                        if (this.shield_1_z - cube_scale <= arrow_points[6][2][0] && arrow_points[6][2][0] <= this.shield_1_z + cube_scale) {
                            console.log("Shield up hit");
                            hit_shield();
                        }
                    }
                }
                this.shapes.cube.draw(context, program_state, shield_1_transform, this.materials.obstacle_shader.override({color: hex_color("#FFFFFF")}));
            }

            /*
            if(this.life_x - cube_scale <= lifept_x && lifept_x <= this.life_x + cube_scale)
            {
                if(this.life_y - cube_scale <= lifept_y && lifept_y <= this.life_y + cube_scale)
                {
                    if(this.life_z - cube_scale <= lifept_z && lifept_z <= this.life_z + cube_scale)
                    {
                        console.log("Life up hit");
                        this.lives++;
                    }
                }
            }
            */
            if(this.show_life_block) {
                if ((this.life_x - cube_scale) <= arrow_points[0][0][0] && arrow_points[0][0][0] <= (this.life_x + cube_scale)) {
                    //console.log("tip align x");
                    if ((this.life_y - cube_scale) <= arrow_points[0][1][0] && arrow_points[0][1][0] <= (this.life_y + cube_scale)) {
                        //console.log("tip align y");
                        if ((this.life_z - cube_scale) <= arrow_points[0][2][0] && arrow_points[0][2][0] <= (this.life_z + cube_scale)) {
                            console.log("Life Up Hit");
                            hit_life();
                        }
                    }
                }

                if (this.life_x - cube_scale <= arrow_points[1][0][0] && arrow_points[1][0][0] <= this.life_x + cube_scale) {
                    if (this.life_y - cube_scale <= arrow_points[1][1][0] && arrow_points[1][1][0] <= this.life_y + cube_scale) {
                        if (this.life_z - cube_scale <= arrow_points[1][2][0] && arrow_points[1][2][0] <= this.life_z + cube_scale) {
                            console.log("Life Up Hit");
                            hit_life();
                        }
                    }
                }

                if (this.life_x - cube_scale <= arrow_points[2][0][0] && arrow_points[2][0][0] <= this.life_x + cube_scale) {
                    if (this.life_y - cube_scale <= arrow_points[2][1][0] && arrow_points[2][1][0] <= this.life_y + cube_scale) {
                        if (this.life_z - cube_scale <= arrow_points[2][2][0] && arrow_points[2][2][0] <= this.life_z + cube_scale) {
                            console.log("Life Up Hit");
                            hit_life();
                        }
                    }
                }

                if (this.life_x - cube_scale <= arrow_points[3][0][0] && arrow_points[3][0][0] <= this.life_x + cube_scale) {
                    if (this.life_y - cube_scale <= arrow_points[3][1][0] && arrow_points[3][1][0] <= this.life_y + cube_scale) {
                        if (this.life_z - cube_scale <= arrow_points[3][2][0] && arrow_points[3][2][0] <= this.life_z + cube_scale) {
                            console.log("Life Up Hit");
                            hit_life();
                        }
                    }
                }

                if (this.life_x - cube_scale <= arrow_points[4][0][0] && arrow_points[4][0][0] <= this.life_x + cube_scale) {
                    if (this.life_y - cube_scale <= arrow_points[4][1][0] && arrow_points[4][1][0] <= this.life_y + cube_scale) {
                        if (this.life_z - cube_scale <= arrow_points[4][2][0] && arrow_points[4][2][0] <= this.life_z + cube_scale) {
                            console.log("Life Up Hit");
                            hit_life();
                        }
                    }
                }

                if (this.life_x - cube_scale <= arrow_points[5][0][0] && arrow_points[5][0][0] <= this.life_x + cube_scale) {
                    if (this.life_y - cube_scale <= arrow_points[5][1][0] && arrow_points[5][1][0] <= this.life_y + cube_scale) {
                        if (this.life_z - cube_scale <= arrow_points[5][2][0] && arrow_points[5][2][0] <= this.life_z + cube_scale) {
                            console.log("Life Up Hit");
                            hit_life();
                        }
                    }
                }

                if (this.life_x - cube_scale <= arrow_points[6][0][0] && arrow_points[6][0][0] <= this.life_x + cube_scale) {
                    if (this.life_y - cube_scale <= arrow_points[6][1][0] && arrow_points[6][1][0] <= this.life_y + cube_scale) {
                        if (this.life_z - cube_scale <= arrow_points[6][2][0] && arrow_points[6][2][0] <= this.life_z + cube_scale) {
                            console.log("Life Up Hit");
                            hit_life();
                        }
                    }
                }
                this.shapes.cube.draw(context, program_state, life_up_transform, this.materials.obstacle_shader.override({color: hex_color("#800080")}));

            }



            //this.shapes.cube.draw(context, program_state, model_transform.times(Mat4.scale(2,2,2)), this.materials.obstacle_shader.override({color: hex_color("#FFFFFF")}));

            //obstacles
            let obstacle_transform = model_transform.times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.scale(1,1,25));
            let left_to_right_obstacle = obstacle_transform.times(Mat4.translation(15*Math.cos((Math.PI/this.period_denominator)*t), 0, 0 ));
            let right_to_left_obstacle = obstacle_transform.times(Mat4.translation(-15*Math.cos((Math.PI/this.period_denominator)*t), 0, 0 ));
            let obstacle_1 = left_to_right_obstacle.times(Mat4.translation(0,-5,0.3));
            let obstacle_2 = right_to_left_obstacle.times(Mat4.translation(0,-10,0.3));
            let obstacle_3 = left_to_right_obstacle.times(Mat4.translation(0,-15,0.3));
            let obstacle_4 = right_to_left_obstacle.times(Mat4.translation(0,-20,0.3));

            let ob1_coord = obstacle_1.times([[0],[0],[0],[1]]);
            let ob2_coord = obstacle_2.times([[0],[0],[0],[1]]);
            let ob3_coord = obstacle_3.times([[0],[0],[0],[1]]);
            let ob4_coord = obstacle_4.times([[0],[0],[0],[1]]);

            let distance_btwn_tip_ob1 = Math.sqrt(Math.pow(ob1_coord[0][0] - arrow_tip_coord[0][0], 2) + Math.pow(ob1_coord[2][0] - arrow_tip_coord[2][0], 2));
            let distance_btwn_tip_ob2 = Math.sqrt(Math.pow(ob2_coord[0][0] - arrow_tip_coord[0][0], 2) + Math.pow(ob2_coord[2][0] - arrow_tip_coord[2][0], 2));
            let distance_btwn_tip_ob3 = Math.sqrt(Math.pow(ob3_coord[0][0] - arrow_tip_coord[0][0], 2) + Math.pow(ob3_coord[2][0] - arrow_tip_coord[2][0], 2));
            let distance_btwn_tip_ob4 = Math.sqrt(Math.pow(ob4_coord[0][0] - arrow_tip_coord[0][0], 2) + Math.pow(ob4_coord[2][0] - arrow_tip_coord[2][0], 2));

            let distance_btwn_set1_ob1 = Math.sqrt(Math.pow(ob1_coord[0][0] - arrow_setback1[0][0], 2) + Math.pow(ob1_coord[2][0] - arrow_setback1[2][0], 2));
            let distance_btwn_set1_ob2 = Math.sqrt(Math.pow(ob2_coord[0][0] - arrow_setback1[0][0], 2) + Math.pow(ob2_coord[2][0] - arrow_setback1[2][0], 2));
            let distance_btwn_set1_ob3 = Math.sqrt(Math.pow(ob3_coord[0][0] - arrow_setback1[0][0], 2) + Math.pow(ob3_coord[2][0] - arrow_setback1[2][0], 2));
            let distance_btwn_set1_ob4 = Math.sqrt(Math.pow(ob4_coord[0][0] - arrow_setback1[0][0], 2) + Math.pow(ob4_coord[2][0] - arrow_setback1[2][0], 2));

            let distance_btwn_set2_ob1 = Math.sqrt(Math.pow(ob1_coord[0][0] - arrow_setback2[0][0], 2) + Math.pow(ob1_coord[2][0] - arrow_setback2[2][0], 2));
            let distance_btwn_set2_ob2 = Math.sqrt(Math.pow(ob2_coord[0][0] - arrow_setback2[0][0], 2) + Math.pow(ob2_coord[2][0] - arrow_setback2[2][0], 2));
            let distance_btwn_set2_ob3 = Math.sqrt(Math.pow(ob3_coord[0][0] - arrow_setback2[0][0], 2) + Math.pow(ob3_coord[2][0] - arrow_setback2[2][0], 2));
            let distance_btwn_set2_ob4 = Math.sqrt(Math.pow(ob4_coord[0][0] - arrow_setback2[0][0], 2) + Math.pow(ob4_coord[2][0] - arrow_setback2[2][0], 2));

            let distance_btwn_set3_ob1 = Math.sqrt(Math.pow(ob1_coord[0][0] - arrow_setback3[0][0], 2) + Math.pow(ob1_coord[2][0] - arrow_setback3[2][0], 2));
            let distance_btwn_set3_ob2 = Math.sqrt(Math.pow(ob2_coord[0][0] - arrow_setback3[0][0], 2) + Math.pow(ob2_coord[2][0] - arrow_setback3[2][0], 2));
            let distance_btwn_set3_ob3 = Math.sqrt(Math.pow(ob3_coord[0][0] - arrow_setback3[0][0], 2) + Math.pow(ob3_coord[2][0] - arrow_setback3[2][0], 2));
            let distance_btwn_set3_ob4 = Math.sqrt(Math.pow(ob4_coord[0][0] - arrow_setback3[0][0], 2) + Math.pow(ob4_coord[2][0] - arrow_setback3[2][0], 2));

            let distance_btwn_set4_ob1 = Math.sqrt(Math.pow(ob1_coord[0][0] - arrow_setback4[0][0], 2) + Math.pow(ob1_coord[2][0] - arrow_setback4[2][0], 2));
            let distance_btwn_set4_ob2 = Math.sqrt(Math.pow(ob2_coord[0][0] - arrow_setback4[0][0], 2) + Math.pow(ob2_coord[2][0] - arrow_setback4[2][0], 2));
            let distance_btwn_set4_ob3 = Math.sqrt(Math.pow(ob3_coord[0][0] - arrow_setback4[0][0], 2) + Math.pow(ob3_coord[2][0] - arrow_setback4[2][0], 2));
            let distance_btwn_set4_ob4 = Math.sqrt(Math.pow(ob4_coord[0][0] - arrow_setback4[0][0], 2) + Math.pow(ob4_coord[2][0] - arrow_setback4[2][0], 2));

            let distance_btwn_set5_ob1 = Math.sqrt(Math.pow(ob1_coord[0][0] - arrow_setback5[0][0], 2) + Math.pow(ob1_coord[2][0] - arrow_setback5[2][0], 2));
            let distance_btwn_set5_ob2 = Math.sqrt(Math.pow(ob2_coord[0][0] - arrow_setback5[0][0], 2) + Math.pow(ob2_coord[2][0] - arrow_setback5[2][0], 2));
            let distance_btwn_set5_ob3 = Math.sqrt(Math.pow(ob3_coord[0][0] - arrow_setback5[0][0], 2) + Math.pow(ob3_coord[2][0] - arrow_setback5[2][0], 2));
            let distance_btwn_set5_ob4 = Math.sqrt(Math.pow(ob4_coord[0][0] - arrow_setback5[0][0], 2) + Math.pow(ob4_coord[2][0] - arrow_setback5[2][0], 2));

            let distance_btwn_end_ob1 = Math.sqrt(Math.pow(ob1_coord[0][0] - arrow_endpoint_coord[0][0], 2) + Math.pow(ob1_coord[2][0] - arrow_endpoint_coord[2][0], 2));
            let distance_btwn_end_ob2 = Math.sqrt(Math.pow(ob2_coord[0][0] - arrow_endpoint_coord[0][0], 2) + Math.pow(ob2_coord[2][0] - arrow_endpoint_coord[2][0], 2));
            let distance_btwn_end_ob3 = Math.sqrt(Math.pow(ob3_coord[0][0] - arrow_endpoint_coord[0][0], 2) + Math.pow(ob3_coord[2][0] - arrow_endpoint_coord[2][0], 2));
            let distance_btwn_end_ob4 = Math.sqrt(Math.pow(ob4_coord[0][0] - arrow_endpoint_coord[0][0], 2) + Math.pow(ob4_coord[2][0] - arrow_endpoint_coord[2][0], 2));

            //console.log(distance_btwn_tip_ob1);
            if(!this.shield_active) {
                if (distance_btwn_tip_ob1 <= 0.5 || distance_btwn_tip_ob2 <= 0.5 || distance_btwn_tip_ob3 <= 0.5 || distance_btwn_tip_ob4 <= 0.5) {
                    console.log("tip hit obstacle");
                    reset_game();
                    this.lives--;
                    if(this.lives === 0)
                    {
                        this.game_active = false;
                    }
                }
                if (distance_btwn_set1_ob1 <= 0.5 || distance_btwn_set1_ob2 <= 0.5 || distance_btwn_set1_ob3 <= 0.5 || distance_btwn_set1_ob4 <= 0.5) {
                    console.log("set1 hit obstacle");
                    reset_game();
                    this.lives--;
                    if(this.lives === 0)
                    {
                        this.game_active = false;
                    }
                }
                if (distance_btwn_set2_ob1 <= 0.5 || distance_btwn_set2_ob2 <= 0.5 || distance_btwn_set2_ob3 <= 0.5 || distance_btwn_set2_ob4 <= 0.5) {
                    console.log("set2 hit obstacle");
                    reset_game();
                    this.lives--;
                    if(this.lives === 0)
                    {
                        this.game_active = false;
                    }
                }
                if (distance_btwn_set3_ob1 <= 0.5 || distance_btwn_set3_ob2 <= 0.5 || distance_btwn_set3_ob3 <= 0.5 || distance_btwn_set3_ob4 <= 0.5) {
                    console.log("set3 hit obstacle");
                    reset_game();
                    this.lives--;
                    if(this.lives === 0)
                    {
                        this.game_active = false;
                    }
                }
                if (distance_btwn_set4_ob1 <= 0.5 || distance_btwn_set4_ob2 <= 0.5 || distance_btwn_set4_ob3 <= 0.5 || distance_btwn_set4_ob4 <= 0.5) {
                    console.log("set4 hit obstacle");
                    reset_game();
                    this.lives--;
                    if(this.lives === 0)
                    {
                        this.game_active = false;
                    }
                }
                if (distance_btwn_set5_ob1 <= 0.5 || distance_btwn_set5_ob2 <= 0.5 || distance_btwn_set5_ob3 <= 0.5 || distance_btwn_set5_ob4 <= 0.5) {
                    console.log("set4 hit obstacle");
                    reset_game();
                    this.lives--;
                    if(this.lives === 0)
                    {
                        this.game_active = false;
                    }
                }
                if (distance_btwn_end_ob1 <= 0.5 || distance_btwn_end_ob2 <= 0.5 || distance_btwn_end_ob3 <= 0.5 || distance_btwn_end_ob4 <= 0.5) {
                    console.log("end hit obstacle");
                    reset_game();
                    this.lives--;
                    if(this.lives === 0)
                    {
                        this.game_active = false;
                    }
                }
            }

            this.shapes.obstacle.draw(context, program_state, obstacle_1, this.materials.obstacle_shader.override({color: hex_color("ffa500")}));
            console.log("Obstacle 1 drawn");
            this.shapes.obstacle.draw(context, program_state, obstacle_2, this.materials.obstacle_shader.override({color: hex_color("ffa500")}));
            console.log("Obstacle 2 drawn");
            this.shapes.obstacle.draw(context, program_state, obstacle_3, this.materials.obstacle_shader.override({color: hex_color("ffa500")}));
            console.log("Obstacle 3 drawn");
            this.shapes.obstacle.draw(context, program_state, obstacle_4, this.materials.obstacle_shader.override({color: hex_color("ffa500")}));
            console.log("Obstacle 4 drawn");

            //Text Display
            this.shapes.text.set_string("Super Archer", context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-7,10,-10).times(Mat4.scale(1,1,1))), this.materials.text_image);
            this.shapes.text.set_string("Score:" + this.score, context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-3,8,-10).times(Mat4.scale(0.75,0.75,0.75))), this.materials.text_image);
            this.shapes.text.set_string("Lives:" + this.lives, context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(14,10,-10).times(Mat4.scale(0.76,0.76,0.76))), this.materials.text_image);
        }
        else{
            this.shapes.text.set_string("Game Over", context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-11,2,-10).times(Mat4.scale(2,2,2))), this.materials.text_image);
            //this.justDied = true;
            this.shapes.text.set_string("Press 'b' to restart", context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-13.2,-2,-10).times(Mat4.scale(1,1,1))), this.materials.text_image);
            draw_cloud(model_transform.times(Mat4.translation(-15*Math.cos((Math.PI/10)*t),8,-15)).times(Mat4.scale(2,2,2)));
            draw_cloud(model_transform.times(Mat4.translation(15*Math.cos((Math.PI/10)*t),9,-15)).times(Mat4.scale(2,2,2)));
        }

    }

}

class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        varying vec4 vertex_color;
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                
                // Compute an initial (ambient) color:
                vertex_color = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                vertex_color.xyz += phong_model_lights( N, vertex_worldspace );
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                gl_FragColor = vertex_color;
                return;
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
            center = model_transform * vec4(0.0, 0.0, 0.0, 1.0);
            point_position = model_transform * vec4(position, 1.0);
            gl_Position = projection_camera_model_transform * vec4(position, 1.0);
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        void main(){
            gl_FragColor = sin(20.0 * distance(point_position.xyz, center.xyz)) * vec4(0.6901, 0.502, 0.251, 1.0);
        }`;
    }
}